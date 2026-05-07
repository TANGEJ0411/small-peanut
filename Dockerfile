FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY build/libs/*.jar app.jar
ENTRYPOINT ["java", \
  "-Xmx512m", "-Xms256m", \
  "-XX:+UseG1GC", \
  "-XX:MaxMetaspaceSize=150m", \
  "-jar", "app.jar"]
