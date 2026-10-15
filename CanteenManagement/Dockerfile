FROM tomcat:10.1-jdk17

WORKDIR /usr/local/tomcat

# Copy the webapp into Tomcat deployment directory
COPY . /usr/local/tomcat/webapps/canteen

# Compile servlet classes into WEB-INF/classes
RUN mkdir -p /usr/local/tomcat/webapps/canteen/WEB-INF/classes \
    && javac -encoding UTF-8 \
        -cp /usr/local/tomcat/webapps/canteen/WEB-INF/lib/*:/usr/local/tomcat/lib/* \
        -d /usr/local/tomcat/webapps/canteen/WEB-INF/classes \
        /usr/local/tomcat/webapps/canteen/Backend/*.java 2>&1 || true

EXPOSE 8080

# Start Tomcat
CMD ["catalina.sh", "run"]

# command for dcoker start
# docker compose up --build
# mysql -h 127.0.0.1 -P 3307 -u root -p2005 
