import { Component,ViewEncapsulation, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {MatSelectModule} from '@angular/material/select';
import { Chart } from '../chart';
import { finalChart } from '../finalchart';
import { GetChartDataService } from '../get-Chart-Data.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import { delay } from 'rxjs/operators';
import { Place } from '../place';
import { Timestamp } from 'rxjs/internal/operators/timestamp';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {

  chart: Chart[]=[];
  SMAChart1: Chart[]=[];
  SMAChart2: Chart[]=[];
  SMAChart24: Chart[]=[];
  sortedChart: Chart[]=[];
  semiFinalChart: Chart[]=[];
  finalChart: finalChart[]=[];
  avgChart: Chart[] = [];
  //places: Place[]=[];
  
  


  marked = false;
  theCheckbox = false;

 //@Input() stationList: ListOfStationsComponent;

  private margin = {top: 10, right: 5, bottom: 30, left: 50};
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;
  private line1: d3Shape.Line<[number, number]>;
  private duration: number = 1;
  private title: any; 
  /*sma: SMA[]=[];
  private durationForAvg:number;
  private sum: any;
  private key: number;
  private value: string;
  private val: any;
  private AvgArray = [];
  private current_hour: any;*/
  public toggle: boolean = false;
  public dailyFlag: boolean = true;
  public timer:any;
  public flag:boolean=true;
  public UrlPath :string;

  constructor(private getChartDataService: GetChartDataService,private route: ActivatedRoute,private router: Router,private location: Location ) {
    router.events.pipe(filter(event=> event instanceof NavigationEnd)).subscribe((event:NavigationEnd)=>{
      console.log("event URL: ",event.url);
      this.UrlPath = event.url;
     });  

        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.title = 'Line Chart for last Week';
   }

  private id = this.route.snapshot.paramMap.get('stationName');
  


  ngOnInit() {
      this.fetchChartData();
      //console.log("paratmeter is : "+ this.id);
  }

  findChartData(num){
    this.duration = num.value;
 /*   if(this.duration == 1)
      this.title = 'Line Chart for last Week';
    if(this.duration == 30)
      this.title = 'Line Chart for last Month';
    if(this.duration == 12)
      this.title = 'Line Chart for last Year';  
  */
   this.getChartDataService.findData(this.id,this.duration).subscribe(() => {
      console.log("fetching real time data");
      this.fetchChartData();
      //this.router.navigate(['/line_chart/'+this.id]);
    });
  }
  
   fetchChartData(){
     
      this.getChartDataService
        .getChartData()
        .subscribe(async (data: Chart[]) =>{
            this.chart = data;
            


            console.log("Chart data from ES");
            console.log(this.chart);

            //this.dataProcess();
            this.sortedChart = this.chart.sort((a: Chart, b: Chart) => {
              if(a.lastCommunicationTime > b.lastCommunicationTime){
                return 1;
              }
              if(a.lastCommunicationTime < b.lastCommunicationTime){
                return -1;
              }
              return 0;
          });
        

            console.log("Sorted Chart data");
            console.log(this.sortedChart);
            
            this.setGranularity();
            //this.drawLineChart();
            
            //await this.delay(15000);
            //d3.selectAll("svg > *").remove();
           // this.getChartDataService.findData(this.id,this.duration).subscribe(() => {
            //  this.fetchChartData();
           //});
            
            
        });
  }

  async setGranularity(){
    var count =1;
    var sum = 0;
    var avg = 0; 
/*-------------------------Set granularity for last one week (daily avg)-------------------- */
  if(this.dailyFlag){
    
    if(this.duration==1)
      this.title = 'Daily Average Line Chart for last week'; 
    if(this.duration==30)
      this.title = 'Daily Average Line Chart for last Month';
    if(this.duration==12)
      this.title = 'Daily Average Line Chart for last Year';

      
    this.finalChart = [];
    var j = 0;
    for(var i=0; i<this.chart.length; i++){
      sum = sum + this.chart[i].availableDocks;
      if((i+1)%720==0){
        sum = sum + this.chart[i].availableDocks;
        avg = Math.floor(sum/720);
        this.finalChart.push({availableDocks:avg,lastCommunicationTime:count});
        count++;
        sum=0;
        avg=0;
      }  
    }
    console.log('granulated chart daily');
    console.log(this.finalChart);
    count=0;
    sum=0;
    avg=0;
  }


/*-------------------------Set granularity for last 1 week (Hourly avg)-------------------- */
  else{
    if(this.duration==1)
      this.title = 'Hourly Average Line Chart for last week'; 
    if(this.duration==30)
      this.title = 'Hourly Average Line Chart for last Month';
    if(this.duration==12) 
      this.title = 'Hourly Average Line Chart for last Year';
    this.finalChart = [];
    
    for(var i=0; i<this.chart.length; i++){
      sum = sum + this.chart[i].availableDocks;
      if((i+1)%30==0){
        sum = sum + this.chart[i].availableDocks;
        avg = Math.floor(sum/30);
        this.finalChart.push({availableDocks:avg,lastCommunicationTime:count});
        count++;
        sum=0;
        avg=0;
      }  
    }


    console.log('Granulated chart hourly');
    console.log(this.finalChart);
  }



 
  d3.selectAll("svg > *").remove();
  this.drawLineChart();

  await this.delay(150000);

  if(this.UrlPath != "/list_of_stations" && !this.UrlPath.startsWith("/SMA_line_chart")){
      this.getChartDataService.findData(this.id,this.duration).subscribe(() => {
        this.fetchChartData();
      });
  }
  
  



/*----------------------------------------------------------------------------- */
  }

  async toggleVisibility_hourly(e){

   if(e==24){
     this.dailyFlag = true;
     this.setGranularity();
   }
   if(e==1){
       this.dailyFlag = false;
       this.setGranularity();
    }
    if(e=='H'){
      d3.selectAll("svg > *").remove();
      this.dailyFlag = true;
      this.setGranularity();
    }

    
  }

 

  delay(ms: number) {
    //this.fetchChartData();
    console.log("In delay");
    //this.timer = setTimeout(function(){console.log("in timeout function")},ms);
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  private drawLineChart(){

    
      this.svg = d3.select('svg')
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    
      /////////////////////////////////////////////////////////////////////////////////
    
      this.x = d3Scale.scaleBand().range([0, this.width]).domain(this.finalChart.map((s) => s.lastCommunicationTime));
      this.y = d3Scale.scaleLinear().range([this.height, 0]);
      //this.x.domain(d3Array.extent(this.chart, (d) => d.lastCommunicationTime ));
      this.y.domain([0,20]);
  
      /////////////////////////////////////////////////////////////////////////////////
  
      this.svg.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(d3Axis.axisBottom(this.x))
        .append('text')
        .attr('class','axis-title')
        .attr('transform','rotate(0)')
        .attr('y',-12)
        .attr('x',1150)
        .attr('dy','.71em')
        .style('text-anchor','end')
        .text('Time');
  
      this.svg.append('g')
        .attr('class', 'axis axis--y')
        .call(d3Axis.axisLeft(this.y))
        .append('text')
        .attr('class', 'axis-title-x')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Available Docks');
  
         /////////////////////////////////////////////////////////////////////////////////
          this.line = d3Shape.line()
          .x( (d: any) => this.x(d.lastCommunicationTime))
          .y( (d: any) => this.y(d.availableDocks));
        
        
          this.svg.append('path')
          .datum(this.finalChart)
          .attr('class', 'line')
          .attr('stroke','red')
          .attr('d', this.line);
          console.log("after line chart");

  }

  goBack(): void {
    this.location.back();
  }

  goBackHome(): void {
    
    this.router.navigate(['/find/']);
  }

}
