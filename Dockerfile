# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom.xml first to take advantage of Docker layer caching
COPY pom.xml .

# Download dependencies in an isolated layer to speed up future builds
RUN mvn dependency:go-offline -B || true

# Copy application source code
COPY src ./src

# Build the executable jar skipping tests (tests rely on external live database & AI keys)
RUN mvn clean package -Dmaven.test.skip=true

# ==========================================
# 2. RUNTIME STAGE
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root group and user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Ensure proper file ownership
RUN chown spring:spring app.jar

# Run container as non-privileged user
USER spring:spring

# Expose Spring Boot default port
EXPOSE 8080

# Configure JVM container options for memory efficiency
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Launch Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
