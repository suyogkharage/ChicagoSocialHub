Total number of lines of code:1130 
IMPORTANT - Place the 'Source Code' folder at c:\tmp

Software Installations needed for this application :

1- java/JDK11
2- Python 3.7
3- Angular 7
4- Anaconda
5- Visual studio code
6- Node.js/Express
7- Angular CLI
8- PostgreSQL
9- ElasticSearch	
10-logstash 6.6.2



Steps to run the application:

Create your Yelp API key and update the ipynb script with that key.
Create your Google Map API Key and add your Key to the client/Angular frontend file, app.module.ts.

1- Start the ElasticSearch server (run the elasticsearch.bat file through cmd)
2- place the provided logstash.conf file at bin folder in installation directory of logstash and run it using 'logstash -f logstash.conf' command
3- Start postgreSQL 
4- Run the provided 'ChicagpSocialHub-Yelp.ipynb' file
5- Run the provided 'divvy_stations_status.ipynb' file 
6- Run the provided 'divvy_stations_status_logs.ipynb' file 
7- Start Express server using command 'node server'
8- Compile and run the frontend application through visual studio code (ng serve)

libraries needed for frontend application:

1- d3.js (npm install d3)
