////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


/// This file and the source code provided can be used only for   
/// the projects and assignments of this course

/// Last Edit by Dr. Atef Bader: 1/27/2019


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
//////////////////////              SETUP NEEDED                ////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//  Install Nodejs (the bundle includes the npm) from the following website:
//      https://nodejs.org/en/download/


//  Before you start nodejs make sure you install from the  
//  command line window/terminal the following packages:
//      1. npm install express
//      2. npm install pg
//      3. npm install pg-format
//      4. npm install moment --save
//      5. npm install elasticsearch


//  Read the docs for the following packages:
//      1. https://node-postgres.com/
//      2.  result API: 
//              https://node-postgres.com/api/result
//      3. Nearest Neighbor Search
//              https://postgis.net/workshops/postgis-intro/knn.html    
//      4. https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/quick-start.html
//      5. https://momentjs.com/
//      6. http://momentjs.com/docs/#/displaying/format/


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


const express = require('express');

var pg = require('pg');

var bodyParser = require('body-parser');

const moment = require('moment');


// Connect to elasticsearch Server

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: '127.0.0.1:9200',
  log: 'error'
});


// Connect to PostgreSQL server

var conString = "pg://postgres:root@127.0.0.1:5432/chicago_divvy_stations";
var pgClient = new pg.Client(conString);
pgClient.connect();

var find_places_task_completed = false;             


const app = express();
const router = express.Router();


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

router.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});



var places_found = [];
var stations_found = [];
var chart_data_found = [];
var chart_data_found1 = [];
var chart_data_found2 = [];
var place_selected;
var station_selected;
var stationname;
var duration;



/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

//////   The following are the routes received from NG/Browser client        ////////

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////



router.route('/places').get((req, res) => {

    res.json(places_found)
    
});



router.route('/place_selected').get((req, res) => {

    res.json(place_selected)
   
});



router.route('/allPlaces').get((req, res) => {

    res.json(places_found)
   
});




router.route('/stations').get((req, res) => {
   
    res.json(stations_found)
           
});
   
router.route('/chartData').get((req, res) => {
   
    res.json(chart_data_found1)
           
});   

router.route('/SMAchartData').get((req, res) => {
   
    res.json(chart_data_found2)
           
}); 







router.route('/stations/find').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);

    for (var i = 0,len = places_found.length; i < len; i++) {

        if ( places_found[i].name === req.body.placeName ) { // strict equality test

            place_selected = places_found[i];

            break;
        }
    }
 
    const query = {
        // give the query a unique name
        name: 'fetch-divvy',
        text: ' SELECT * FROM divvy_stations_status ORDER BY (divvy_stations_status.where_is <-> ST_POINT($1,$2)) LIMIT 3',
        values: [place_selected.latitude, place_selected.longitude]
    }

    find_stations_from_divvy(query).then(function (response) {
        var hits = response;
        res.json({'stations_found': 'Added successfully'});
    });
 

});

router.route('/stations/SMAchart').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);

    find_chart_task_completed = false; 

	
	stationname = req.body.station;
	duration = req.body.val;
	
	

	find_SMA_chart_data_from_ES(req.body.station, req.body.val).then(function (response) {
        var hits = response;
        res.json(chart_data_found2);
    });

});

router.route('/places/find').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);

    find_places_task_completed = false;             

    find_places_from_yelp(req.body.find, req.body.where, req.body.zipcode).then(function (response) {
        var hits = response;
        res.json(places_found);
    });

});


router.route('/stations/chart').post((req, res) => {

    var str = JSON.stringify(req.body, null, 4);
	
	find_chart_task_completed = false; 

	find_chart_data_from_ES(req.body.stationName, req.body.duration).then(function (response) {
        var hits = response;
        res.json(chart_data_found1);
    });

});


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

////////////////////    Divvy - PostgreSQL - Client API            /////////////////

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

async function find_chart_data_from_divvy(query) {

	try
	{
		const response = await pgClient.query(query);

		chart_data_found = [];

		for (i = 0; i < response.rows.length; i++) {
					
			 plainTextDateTime =  moment(response.rows[i].lastcommunicationtime).format('YYYY-MM-DD, h:mm:ss a');
		

			var station = {
						"availableDocks": response.rows[i].availabledocks,
						"lastCommunicationTime": plainTextDateTime,
			};

			chart_data_found.push(station);
			
		}

    }
	catch(error){
		console.error(error);
	}

}



async function find_stations_from_divvy(query) {

    const response = await pgClient.query(query);

    stations_found = [];

    for (i = 0; i < 3; i++) {
                
         plainTextDateTime =  moment(response.rows[i].lastcommunicationtime).format('YYYY-MM-DD, h:mm:ss a');
    

        var station = {
                    "id": response.rows[i].id,
                    "stationName": response.rows[i].stationname,
                    "availableBikes": response.rows[i].availablebikes,
                    "availableDocks": response.rows[i].availabledocks,
                    "is_renting": response.rows[i].is_renting,
                    "lastCommunicationTime": plainTextDateTime,
                    "latitude": response.rows[i].latitude,    
                    "longitude": response.rows[i].longitude,
                    "status": response.rows[i].status,
                    "totalDocks": response.rows[i].totaldocks
        };

        stations_found.push(station);

    }


}




/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

////////////////////    Yelp - ElasticSerch - Client API            /////////////////

////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////



async function find_places_from_yelp(place, where, zipcode) {

    places_found = [];

//////////////////////////////////////////////////////////////////////////////////////
// Using the business name to search for businesses will leead to incomplete results
// better to search using categorisa/alias and title associated with the business name
// For example one of the famous places in chicago for HotDogs is Portillos
// However, it also offers Salad and burgers
// Here is an example of a busness review from Yelp for Pertilos
//               alias': 'portillos-hot-dogs-chicago-4',
//              'categories': [{'alias': 'hotdog', 'title': 'Hot Dogs'},
//                             {'alias': 'salad', 'title': 'Salad'},
//                             {'alias': 'burgers', 'title': 'Burgers'}],
//              'name': "Portillo's Hot Dogs",
//////////////////////////////////////////////////////////////////////////////////////
	var where = where;
	var zipcode= zipcode;
	
	var key;
	var value;
	var body;
	
	if(zipcode.length <=1)
	{
		 body = {
			size: 1000,
			from: 0,
			"query": {
			  "bool" : {
				"must" : {
				   "term" : { "categories.alias" : place } 
				},


				"filter": {
					"term" : { "location.address1" : where }
		
			 },


				"must_not" : {
				  "range" : {
					"rating" : { "lte" : 3 }
				  }
				},

				"must_not" : {
				  "range" : {
					"review_count" : { "lte" : 500 }
				  }
				},

				"should" : [
				  {"term" : { "is_closed" : "false" } }

				],
			  }
			}
		}
	}
	if(where.length <=1 )
	{
		 body = {
			size: 1000,
			from: 0,
			"query": {
			  "bool" : {
				"must" : {
				   "term" : { "categories.alias" : place } 
				},


				"filter": {
					"term" : { "location.zip_code" : zipcode }
		
			 },


				"must_not" : {
				  "range" : {
					"rating" : { "lte" : 3 }
				  }
				},

				"must_not" : {
				  "range" : {
					"review_count" : { "lte" : 500 }
				  }
				},

				"should" : [
				  {"term" : { "is_closed" : "false" } }

				],
			  }
			}
		}
	}
	
   


    results = await esClient.search({index: 'chicago_yelp_reviews', body: body});

	//places_found.push({"key":key,"value":value});
    
	results.hits.hits.forEach((hit, index) => {
        

        var place = {
                "name": hit._source.name,
                "display_phone": hit._source.display_phone,
                "address1": hit._source.location.address1,
                "is_closed": hit._source.is_closed,
                "rating": hit._source.rating,
                "review_count": hit._source.review_count,
                "latitude": hit._source.coordinates.latitude,    
                "longitude": hit._source.coordinates.longitude
        };

        places_found.push(place);

    });

    find_places_task_completed = true;             
      
}

async function find_chart_data_from_ES(stationName, duration) {

	var time=30;
	
	if(duration == 1)
		time = 5040;
	if(duration == 30) 
		time = 21600;
	if(duration == 12)
		time = 21600;
	
    
	chart_data_found1 = [];
	
	var date  = new Date();
	

////////////////////////////////////////////////////////////////////////////////////	
	utc = date.getTime() + (date.getTimezoneOffset()*60000);

	
	//let formatted_date = nd.getFullYear() + "-" + (nd.getMonth() + 1) + "-" + nd.getDate() + " " + (nd.getHours()-1) + ":" + nd.getMinutes() + ":" + nd.getSeconds() 
	
	if(duration == 1)
	{
			last = new Date(utc + (3600000*(-5)));
			
			nd = new Date(last.getTime()- (7*24*60*60*1000));
						
			MyDateString = nd.getFullYear() + '-'
			 + ('0' + (nd.getMonth()+1)).slice(-2) + '-'
             + ('0' + nd.getDate()).slice(-2) + ' '
             + ('0' + nd.getHours()).slice(-2) + ':'
			 + ('0' + nd.getMinutes()).slice(-2) + ':'
			 + ('0' + nd.getSeconds()).slice(-2);		
	}
	if(duration == 30 || duration == 12)
	{
			last = new Date(utc + (3600000*(-5)));
			
			nd = new Date(last.getTime()- (30*24*60*60*1000));
			
			MyDateString = nd.getFullYear() + '-'
			 + ('0' + (nd.getMonth()+1)).slice(-2) + '-'
             + ('0' + nd.getDate()).slice(-2) + ' '
             + ('0' + nd.getHours()).slice(-2) + ':'
			 + ('0' + nd.getMinutes()).slice(-2) + ':'
			 + ('0' + nd.getSeconds()).slice(-2);
	}
	
	
	nd = MyDateString.toLocaleString([],{hour12: false});
////////////////////////////////////////////////////////////////////////////////////////	
	
//	yesterday = new Date(nd);
//	yesterday.setDate(nd.getDate()-1);
	
	
	
    let body1 = {
		size: time,
		from: 0,
//		"aggs": {
//				"unique_lastCommunicationTime": {
//					"terms":{
//						"field": "lastCommunicationTime",
//						"size": time
//					}
//				}
//			},
        "query": {
          "bool" : {
            "must" : {
               "match" : { "stationName" : stationName } 
           },
		   "filter" : {
		   	 "range" : {
              "lastCommunicationTime" : { "gte" : nd }
				}
			}
	     }
	   
	  
//	   "sort": {
//				 "lastCommunicationTime": {"order": "desc",
//											"nested_filter":{
//												"range":{
//													"lastCommunicationTime": {"gte": nd}
//												}
//											}
//											}
//			 }
//	   		   "sort": {
//			   "lastCommunicationTime": {"order": "desc"}
//		   }
    }
	}

	var allRecords = [];
    
	results1 = await esClient.search({index: 'divvy_stations_logs1', body: body1});
	
	//chart_data_found1.push({"availableDocks": 111,"lastCommunicationTime": nd});
    
	results1.hits.hits.forEach((hit, index) => {
        		
		//chart_data_found1.push({"availableDocks": 999,"lastCommunicationTime": nd});
        
		var station = {
                "availableDocks": hit._source.availableDocks,
               "lastCommunicationTime": hit._source.lastCommunicationTime
				//"totalDocks": hit._source.totalDocks,
        };

        chart_data_found1.push(station);

    });
	//chart_data_found1.push({"availableDocks": 14,"lastCommunicationTime": "time30"});
    find_chart_task_completed = true;             
      
}


async function find_SMA_chart_data_from_ES(stationName, duration) {

	var time=30;
	
	if(duration == 1)
		time = 10080;
	if(duration == 24)
		time = 1440;
	if(duration==30)
		time= 60;	
	
	
    chart_data_found2 = [];
	var date  = new Date();
	
	utc = date.getTime() + (date.getTimezoneOffset()*60000);

	
	//let formatted_date = nd.getFullYear() + "-" + (nd.getMonth() + 1) + "-" + nd.getDate() + " " + (nd.getHours()-1) + ":" + nd.getMinutes() + ":" + nd.getSeconds() 
	
	if(duration == 1)
	{		last = new Date(utc + (3600000*(-5)));
			
			nd = new Date(last.getTime()- (14*24*60*60*1000));
						
			MyDateString = nd.getFullYear() + '-'
			 + ('0' + (nd.getMonth()+1)).slice(-2) + '-'
             + ('0' + nd.getDate()).slice(-2) + ' '
             + ('0' + nd.getHours()).slice(-2) + ':'
			 + ('0' + nd.getMinutes()).slice(-2) + ':'
			 + ('0' + nd.getSeconds()).slice(-2);	
	}
	if(duration == 24)
	{
			last = new Date(utc + (3600000*(-5)));
			
			nd = new Date(last.getTime()- (2*24*60*60*1000));
						
			MyDateString = nd.getFullYear() + '-'
			 + ('0' + (nd.getMonth()+1)).slice(-2) + '-'
             + ('0' + nd.getDate()).slice(-2) + ' '
             + ('0' + nd.getHours()).slice(-2) + ':'
			 + ('0' + nd.getMinutes()).slice(-2) + ':'
			 + ('0' + nd.getSeconds()).slice(-2);	
	}
	if(duration== 30)
	{
		nd = new Date(utc + (3600000*(-7)));
			
			MyDateString = nd.getFullYear() + '-'
			 + ('0' + (nd.getMonth()+1)).slice(-2) + '-'
             + ('0' + nd.getDate()).slice(-2) + ' '
             + ('0' + nd.getHours()).slice(-2) + ':'
			 + ('0' + nd.getMinutes()).slice(-2) + ':'
			 + ('0' + nd.getSeconds()).slice(-2);	
	}

	
	nd = MyDateString.toLocaleString([],{hour12: false});
	
	let body1 = {
		size: time,
		from: 0,
//		"aggs": {
//				"unique_lastCommunicationTime": {
//					"terms":{
//						"field": "lastCommunicationTime",
//						"size": time
//					}
//				}
//			},
        "query": {
          "bool" : {
            "must" : {
               "match" : { "stationName" : stationName } 
           },
		   "filter" : {
		   	 "range" : {
              "lastCommunicationTime" : { "gte" : nd }
				}
			}
	     }
	   }
	}


    results1 = await esClient.search({index: 'divvy_stations_logs1', body: body1});
	
	//chart_data_found2.push({"availableDocks": 222,"lastCommunicationTime": nd});
    
	results1.hits.hits.forEach((hit, index) => {
        		
		//chart_data_found1.push({"availableDocks": 12,"lastCommunicationTime": nd});
        
		var station = {
                "availableDocks": hit._source.availableDocks,
                "lastCommunicationTime": hit._source.lastCommunicationTime
        };

        chart_data_found2.push(station);

    });
	//chart_data_found1.push({"availableDocks": 14,"lastCommunicationTime": "time30"});
    find_chart_task_completed = true;             
      
}



app.use('/', router);

app.listen(4000, () => console.log('Express server running on port 4000'));

