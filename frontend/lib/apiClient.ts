// Spring Boot REST API Client
// Direct mapping to existing backend controllers:
// - AuthController (/api/auth)
// - UserController (/api/users)
// - UserSkillController (/api/user-skills)
// - SkillController (/api/skills)
// - LedgerController (/api/ledger)
// - SessionController (/api/sessions)

export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type UserSkillRole = 'OFFERED' | 'WANTED';
export type SessionStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REJECTED'
  | 'CANCELLED';

// Auth DTOs
export interface AuthResponse {
  token: string;
  userId: string;
  displayName: string;
}

export interface RegisterRequest {
  email: string;
  password: string; // min 8
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User DTOs
export interface UpdateBioRequest {
  bio: string;
}

export interface UserMatchResponse {
  userId: string;
  score: number;
}

export interface PublicUserProfileResponse {
  id: string;
  displayName: string;
  bio: string | null;
}

export interface UserSummaryResponse {
  userId: string;
  displayName: string;
}

// UserSkill DTOs
export interface UserSkillRequest {
  skillName: string;
  category?: string | null;
  role: UserSkillRole;
  proficiency?: ProficiencyLevel | null;
}

export interface UserSkillResponse {
  id: string;
  skillId: string;
  skillName: string;
  role: UserSkillRole;
  proficiency: ProficiencyLevel | null;
}

export interface ParsedSkill {
  name: string;
  proficiency: string;
}

export interface ParsedBioResult {
  offered: ParsedSkill[];
  wanted: string[];
}

export interface ConfirmBioRequest {
  confirmedSkills: ParsedBioResult;
}

// Skill DTOs
export interface SkillRequest {
  name: string;
  category?: string | null;
}

export interface SkillResponse {
  id: string;
  name: string;
  category?: string | null;
}

export interface SkillMatchResponse {
  skillId: string;
  name: string;
  score: number;
}

// Ledger DTOs
export type LedgerEntryType = 'SESSION_PAYMENT' | 'SIGNUP_BONUS' | 'ADJUSTMENT';

export interface LedgerEntryResponse {
  id: string;
  amount: number;
  entryType: LedgerEntryType;
  referenceId: string | null;
  createdAt: string;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  entryType: LedgerEntryType;
  referenceId?: string | null;
}

export interface BalanceResponse {
  userId: string;
  balance: number;
}

// Session DTOs
export interface SessionRequest {
  providerId: string;
  skillId: string;
  creditAmount: number;
}

export interface AcceptSessionRequest {
  meetingLink: string;
}

export interface SessionResponse {
  id: string;
  requesterId: string;
  requesterName: string | null;
  requesterEmail: string | null;
  providerId: string;
  providerName: string | null;
  providerEmail: string | null;
  skillId: string;
  creditAmount: number;
  status: SessionStatus;
  meetingLink: string | null;
}

export interface PriceSuggestionResponse {
  suggestion: string;
}

export interface ErrorResponse {
  message: string;
}

// Client-side representation of an authenticated user
export interface AuthUser {
  userId: string;
  displayName: string;
  token: string;
}

// Peer representation combining search score and skills
export interface PeerUser {
  userId: string;
  displayName?: string;
  score: number;
  offeredSkills: string[];
  wantedSkills: string[];
}

const TOKEN_KEY = 'skillswap_auth_token';
const USER_KEY = 'skillswap_auth_user';

class ApiClient {
  private token: string | null = null;
  private currentUser: AuthUser | null = null;
  private authListeners: Array<(user: AuthUser | null) => void> = [];

  // Short-lived in-memory caches for snappy UI performance
  private skillCatalogCache: { data: SkillResponse[]; timestamp: number } | null = null;
  private profileCache = new Map<string, { data: PublicUserProfileResponse; timestamp: number }>();
  private userSkillsCache = new Map<string, { data: UserSkillResponse[]; timestamp: number }>();
  private mySkillsCache: { data: UserSkillResponse[]; timestamp: number } | null = null;
  private balanceCache: { data: BalanceResponse; timestamp: number } | null = null;
  private sessionsCache: { data: SessionResponse[]; timestamp: number } | null = null;

  // In-flight GET request deduplication map to prevent redundant parallel HTTP calls
  private inFlightGetRequests = new Map<string, Promise<any>>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch {
          this.currentUser = null;
        }
      }
    }
  }

  public subscribeAuth(listener: (user: AuthUser | null) => void): () => void {
    this.authListeners.push(listener);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  private notifyAuthChange(): void {
    this.authListeners.forEach((l) => l(this.currentUser));
  }

  public setAuth(data: AuthResponse | null): void {
    // Invalidate all caches on auth change
    this.skillCatalogCache = null;
    this.profileCache.clear();
    this.userSkillsCache.clear();
    this.mySkillsCache = null;
    this.balanceCache = null;
    this.sessionsCache = null;
    this.inFlightGetRequests.clear();

    if (data) {
      this.token = data.token;
      this.currentUser = {
        userId: data.userId,
        displayName: data.displayName,
        token: data.token,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      }
    } else {
      this.token = null;
      this.currentUser = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    this.notifyAuthChange();
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();

    // Deduplicate in-flight GET requests so identical endpoints aren't fetched in parallel
    if (method === 'GET') {
      const cacheKey = endpoint;
      const inFlight = this.inFlightGetRequests.get(cacheKey);
      if (inFlight) {
        return inFlight as Promise<T>;
      }
      const promise = this.executeRequest<T>(endpoint, options).finally(() => {
        this.inFlightGetRequests.delete(cacheKey);
      });
      this.inFlightGetRequests.set(cacheKey, promise);
      return promise;
    }

    return this.executeRequest<T>(endpoint, options);
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Default calls go through /api/... rewritten by Next.js or via NEXT_PUBLIC_API_URL
    const url = endpoint.startsWith('http') ? endpoint : endpoint;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const rawText = await response.text();
        try {
          const errorData = JSON.parse(rawText);
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
            if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
              errorMessage = 'This skill is already added to your profile.';
            }
          } else if (errorData && errorData.error) {
            errorMessage = `${errorData.error}: ${errorData.message || ''}`;
          } else if (rawText) {
            errorMessage = rawText;
          }
        } catch {
          if (rawText) {
            errorMessage = rawText;
          }
        }
      } catch {
        // failed reading response text
      }

      if (response.status === 401 || response.status === 403) {
        // Token expired, unauthorized, or invalid session
        this.setAuth(null);
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  }

  // ==================== AUTH ====================
  public auth = {
    register: async (req: RegisterRequest): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      this.setAuth(res);
      return res;
    },

    login: async (req: LoginRequest): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      this.setAuth(res);
      return res;
    },

    logout: (): void => {
      this.setAuth(null);
    },
  };

  // ==================== USER ====================
  public user = {
    updateBio: async (bio: string): Promise<void> => {
      await this.request<void>('/api/users/me/bio', {
        method: 'PUT',
        body: JSON.stringify({ bio }),
      });
    },

    searchUsers: async (query: string): Promise<UserMatchResponse[]> => {
      return this.request<UserMatchResponse[]>(
        `/api/users/search?query=${encodeURIComponent(query)}`,
        { method: 'GET' }
      );
    },

    getPublicProfile: async (userId: string): Promise<PublicUserProfileResponse> => {
      const cached = this.profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
      const res = await this.request<PublicUserProfileResponse>(`/api/users/${userId}`, {
        method: 'GET',
      });
      if (res) {
        this.profileCache.set(userId, { data: res, timestamp: Date.now() });
      }
      return res;
    },

    findUsersBySkill: async (
      skillName: string,
      role: UserSkillRole = 'OFFERED'
    ): Promise<UserSummaryResponse[]> => {
      return this.request<UserSummaryResponse[]>(
        `/api/users/by-skill?skillName=${encodeURIComponent(skillName)}&role=${encodeURIComponent(role)}`,
        { method: 'GET' }
      );
    },
  };

  // ==================== USER SKILLS ====================
  public userSkills = {
    getMySkills: async (forceRefresh = false): Promise<UserSkillResponse[]> => {
      if (!forceRefresh && this.mySkillsCache && Date.now() - this.mySkillsCache.timestamp < 30000) {
        return this.mySkillsCache.data;
      }
      const res = await this.request<UserSkillResponse[]>('/api/user-skills/me', {
        method: 'GET',
      });
      if (res) {
        this.mySkillsCache = { data: res, timestamp: Date.now() };
      }
      return res;
    },

    getUserSkills: async (userId: string, forceRefresh = false): Promise<UserSkillResponse[]> => {
      const cached = this.userSkillsCache.get(userId);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
      const res = await this.request<UserSkillResponse[]>(`/api/user-skills/user/${userId}`, {
        method: 'GET',
      });
      if (res) {
        this.userSkillsCache.set(userId, { data: res, timestamp: Date.now() });
      }
      return res;
    },

    addSkill: async (req: UserSkillRequest): Promise<UserSkillResponse> => {
      this.mySkillsCache = null; // Invalidate my skills cache
      this.userSkillsCache.clear();
      return this.request<UserSkillResponse>('/api/user-skills', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },

    updateProficiency: async (id: string, proficiency: ProficiencyLevel): Promise<UserSkillResponse> => {
      this.mySkillsCache = null;
      this.userSkillsCache.clear();
      return this.request<UserSkillResponse>(`/api/user-skills/${id}/proficiency`, {
        method: 'PATCH',
        body: JSON.stringify({ proficiency }),
      });
    },

    deleteSkill: async (id: string): Promise<void> => {
      this.mySkillsCache = null;
      this.userSkillsCache.clear();
      await this.request<void>(`/api/user-skills/${id}`, {
        method: 'DELETE',
      });
    },

    parseBio: async (bioText: string): Promise<ParsedBioResult> => {
      return this.request<ParsedBioResult>('/api/user-skills/parse-bio', {
        method: 'POST',
        body: JSON.stringify({ bioText }),
      });
    },

    confirmBio: async (
      confirmedSkills: ParsedBioResult
    ): Promise<UserSkillResponse[]> => {
      this.mySkillsCache = null; // Invalidate my skills cache
      this.userSkillsCache.clear();
      return this.request<UserSkillResponse[]>('/api/user-skills/confirm-bio', {
        method: 'POST',
        body: JSON.stringify({ confirmedSkills }),
      });
    },
  };

  // ==================== SKILLS ====================
  public skills = {
    listAll: async (forceRefresh = false): Promise<SkillResponse[]> => {
      if (!forceRefresh && this.skillCatalogCache && Date.now() - this.skillCatalogCache.timestamp < 120000) {
        return this.skillCatalogCache.data;
      }
      const res = await this.request<SkillResponse[]>('/api/skills', {
        method: 'GET',
      });
      if (res) {
        this.skillCatalogCache = { data: res, timestamp: Date.now() };
      }
      return res;
    },

    create: async (name: string, category?: string | null): Promise<SkillResponse> => {
      this.skillCatalogCache = null;
      return this.request<SkillResponse>('/api/skills', {
        method: 'POST',
        body: JSON.stringify({ name, category: category || null }),
      });
    },

    search: async (query: string): Promise<SkillMatchResponse[]> => {
      return this.request<SkillMatchResponse[]>(
        `/api/skills/search?query=${encodeURIComponent(query)}`,
        { method: 'GET' }
      );
    },
  };

  // ==================== LEDGER ====================
  public ledger = {
    getBalance: async (forceRefresh = false): Promise<BalanceResponse> => {
      if (!forceRefresh && this.balanceCache && Date.now() - this.balanceCache.timestamp < 10000) {
        return this.balanceCache.data;
      }
      const res = await this.request<BalanceResponse>('/api/ledger/balance', {
        method: 'GET',
      });
      if (res) {
        this.balanceCache = { data: res, timestamp: Date.now() };
      }
      return res;
    },

    getHistory: async (): Promise<LedgerEntryResponse[]> => {
      return this.request<LedgerEntryResponse[]>('/api/ledger/history', {
        method: 'GET',
      });
    },

    transfer: async (req: TransferRequest): Promise<void> => {
      this.balanceCache = null; // Invalidate balance on transfer
      await this.request<void>('/api/ledger/transfer', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },
  };

  // ==================== SESSIONS ====================
  public sessions = {
    getMySessions: async (forceRefresh = false): Promise<SessionResponse[]> => {
      if (!forceRefresh && this.sessionsCache && Date.now() - this.sessionsCache.timestamp < 10000) {
        return this.sessionsCache.data;
      }
      const res = await this.request<SessionResponse[]>('/api/sessions/me', {
        method: 'GET',
      });
      if (res) {
        this.sessionsCache = { data: res, timestamp: Date.now() };
      }
      return res;
    },

    requestSession: async (req: SessionRequest): Promise<SessionResponse> => {
      this.sessionsCache = null;
      this.balanceCache = null;
      return this.request<SessionResponse>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },

    acceptSession: async (
      id: string,
      req: AcceptSessionRequest
    ): Promise<SessionResponse> => {
      this.sessionsCache = null;
      return this.request<SessionResponse>(`/api/sessions/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },

    rejectSession: async (id: string): Promise<SessionResponse> => {
      this.sessionsCache = null;
      return this.request<SessionResponse>(`/api/sessions/${id}/reject`, {
        method: 'POST',
      });
    },

    cancelSession: async (id: string): Promise<SessionResponse> => {
      this.sessionsCache = null;
      this.balanceCache = null;
      return this.request<SessionResponse>(`/api/sessions/${id}/cancel`, {
        method: 'POST',
      });
    },

    disputeSession: async (id: string): Promise<SessionResponse> => {
      this.sessionsCache = null;
      return this.request<SessionResponse>(`/api/sessions/${id}/dispute`, {
        method: 'POST',
      });
    },

    completeSession: async (id: string): Promise<SessionResponse> => {
      this.sessionsCache = null;
      this.balanceCache = null;
      return this.request<SessionResponse>(`/api/sessions/${id}/complete`, {
        method: 'POST',
      });
    },

    suggestPrice: async (skillName: string): Promise<PriceSuggestionResponse> => {
      return this.request<PriceSuggestionResponse>(
        `/api/sessions/suggest-price?skillName=${encodeURIComponent(skillName)}`,
        { method: 'GET' }
      );
    },
  };
}

export const apiClient = new ApiClient();
