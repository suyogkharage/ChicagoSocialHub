import { Component,ViewEncapsulation, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd } from '@angular/router';
import { GetChartDataService } from '../get-Chart-Data.service';
import { Router } from '@angular/router';

import { Chart } from '../chart';
import {SMA} from '../sma';
import { finalChart } from '../finalchart';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import { delay, filter } from 'rxjs/operators';
import { summaryFileName } from '@angular/compiler/src/aot/util';

import { Location } from '@angular/common';

@Component({
  selector: 'app-sma-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sma-line-chart.component.html',
  styleUrls: ['./sma-line-chart.component.css']
})
export class SmaLineChartComponent implements OnInit {

  chart: Chart[]=[];
  tempChart: Chart[]=[];
  private tempAVG: any;
  private sum: any;
  sma: SMA[]=[];
  firstElement:any = [];
  private key: number;
  private value: string;
  private count = 0;
  finalChart: finalChart[]=[];
  private margin = {top: 20, right: 20, bottom: 30, left: 50};
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;
  private duration: number = 30;
  private title: any; 
  private durationForAvg:number;
  public UrlPath :string;

  constructor(private getChartDataService: GetChartDataService,private route: ActivatedRoute,private router: Router,private location: Location) { 
    router.events.pipe(filter(event=> event instanceof NavigationEnd)).subscribe((event:NavigationEnd)=>{
     
      this.UrlPath = event.url;
     });  
     
    this.width = 900 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.title = 'SMA Line Chart for last 1 Hour';
  }

  private id = this.route.snapshot.paramMap.get('smaStationName');
  
  ngOnInit() {
   this.fetchSMARecord();

  }

  findChartData(num){
    this.duration = num.value;
    if(num.value==1)
      this.title = 'SMA Line Chart for last 1 week';
    if(num.value==24)
      this.title = 'SMA Line Chart for last Day'; 
    
    d3.selectAll("svg > *").remove();
  
    this.getChartDataService.findSMARecords(this.id,num.value).subscribe(() => {

      this.fetchSMARecord();
      
    });
  }

  fetchSMARecord(){
    this.chart= [];
    this.getChartDataService
      .getSMAChartData()
      .subscribe(async (data: Chart[])=> {
        
        this.chart = [];
        this.chart= data;

        this.chart.sort((a: Chart, b: Chart) => {
          if(a.lastCommunicationTime > b.lastCommunicationTime){
            return 1;
          }
          if(a.lastCommunicationTime < b.lastCommunicationTime){
            return -1;
          }
          return 0;
      });
    
      this.calculateAVG();
      })
    
  }

  async calculateAVG(){
    this.sma= [];
    if(this.duration == 1){
        this.durationForAvg = 5040;
    }
    if(this.duration==24)
      this.durationForAvg = 720;
    if(this.duration == 30)
      this.durationForAvg= 30;
  

    for(let j=0; j< this.durationForAvg; j++)
    {
      this.sum=0;
      for(let i=j; i < j+this.durationForAvg; i++)
      {
        
        this.sum = this.sum + this.chart[i].availableDocks;
        
      }
      this.key = Math.floor(this.sum/this.durationForAvg);
      
      this.sma.push({average:this.key,lastCommunicationTime:this.chart[j].lastCommunicationTime});
           
    }
   
      var j =0;
      if(this.duration==30){
        this.finalChart= [];
        for(var i=0;i<this.sma.length;i++){
          this.finalChart.push({availableDocks:this.sma[i].average,lastCommunicationTime:j});
          j=j+2;
        }
        d3.selectAll("svg > *").remove();
        this.drawSMAChart();
        await this.delay(150000);
        if(this.UrlPath != "/list_of_stations" && !this.UrlPath.startsWith("/line_chart")){
        this.getChartDataService.findSMARecords(this.id,this.duration).subscribe(() => {
          this.fetchSMARecord();
        });
    }
      }
      else
        this.setGranularity(this.sma); 
      

       
  }
  async setGranularity(sma: SMA[]){
   var sum = 0;
   var avg=0;
   var count = 1;
   this.finalChart = [];
   var divider=720; 

     if(this.duration==1){
      divider = 720;
    }
    if(this.duration == 24)
    {
      divider = 30;
    }      

    var j = 0;
      for(var i=0; i<sma.length; i++){
        sum = sum + sma[i].average;
        if((i+1)%divider==0){
          sum = sum + sma[i].average;
          avg = Math.floor(sum/divider);
          this.finalChart.push({availableDocks:avg,lastCommunicationTime:count});
          count++;
          sum=0;
          avg=0;
        }  
      }
 
      count=0;
      sum=0;
      avg=0;
      
      d3.selectAll("svg > *").remove();
      this.drawSMAChart();

      await this.delay(150000);
      if(this.UrlPath != "/list_of_stations" && !this.UrlPath.startsWith("/line_chart")){
        this.getChartDataService.findSMARecords(this.id,this.duration).subscribe(() => {
          this.fetchSMARecord();
   
        });
    }

    }
  

  delay(ms: number) {
   
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  private drawSMAChart() {
    this.svg = d3.select('svg')
        .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.x = d3Scale.scaleBand().range([0, this.width]).domain(this.finalChart.map((s) => s.lastCommunicationTime));
        this.y = d3Scale.scaleLinear().range([this.height, 0]);
        this.y.domain([0,25]);
       
        
        this.svg.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(d3Axis.axisBottom(this.x));
  
    this.svg.append('g')
        .attr('class', 'axis axis--y')
        .call(d3Axis.axisLeft(this.y))
        .append('text')
        .attr('class', 'axis-title')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Moving Average');

    this.line = d3Shape.line()
        .x( (d: any) => this.x(d.lastCommunicationTime))
        .y( (d: any) => this.y(d.availableDocks) );
  
    this.svg.append('path')
        .datum(this.finalChart)
        .attr('class', 'line')
        .attr('stroke','red')
        .attr('d', this.line);
  }


  goBack(): void {
    this.location.back();
  }


}
