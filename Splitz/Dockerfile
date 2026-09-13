# Use an official Maven image to build the project
FROM maven:3.8.7-eclipse-temurin-17 AS build

WORKDIR /app

# Copy project files
COPY . .

# Build the application
RUN mvn clean package -DskipTests

# Use a smaller JDK image for runtime
FROM openjdk:17-jdk-slim AS runtime

WORKDIR /app

# Copy the built JAR file from the previous step
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
