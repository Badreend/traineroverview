temp_data = [
{id:1,name:"Momo Niek",diagnose:"Diagnose: Knie & rug klachten / Cluster: 6 / Week: 5 van 8 / Functie:Kolonel / Doelipsum die la lorem de ipsum tekst. ongeveer, één vol zin",min:90,max:140,loc:[{t:undefined,h:40,x:500,y:450},{t:undefined,h:150,x:450,y:435},{t:undefined,h:110,x:432,y:455},{t:undefined,h:120,x:422,y:510},{t:undefined,h:140,x:390,y:450},{t:undefined,h:145,x:380,y:470},{t:undefined,h:70,x:362,y:505},{t:undefined,h:30,x:322,y:500},]},
{id:2,name:"Ings",diagnose:"Diagnose: Knie & rug klachten / Cluster: 6 / Week: 5 van 8 / Functie:Kolonel / Doelipsum die la lorem de ipsum tekst. ongeveer, één vol zinDoelipsum die la lorem de ipsum tekst. ongeveer, één vol zin",min:90,max:140,loc:[{t:undefined,h:30,x:500,y:450},{t:undefined,h:70,x:450,y:435},{t:undefined,h:80,x:432,y:455},{t:undefined,h:90,x:422,y:510},{t:undefined,h:110,x:390,y:450},{t:undefined,h:100,x:380,y:470},{t:undefined,h:90,x:362,y:505},{t:undefined,h:60,x:322,y:500},]},
{id:3,name:"Ings",diagnose:"Diagnose: van alles / Cluster: 6 / Week: 5 van 8 / Functie:Kolonel / Doelipsum die la lorem de ipsum tekst. ongeveer, één vol zin",min:90,max:140,loc:[{t:undefined,h:90,x:500,y:450},{t:undefined,h:150,x:450,y:435},{t:undefined,h:110,x:432,y:455},{t:undefined,h:120,x:422,y:510},{t:undefined,h:140,x:390,y:450},{t:undefined,h:145,x:380,y:470},{t:undefined,h:70,x:362,y:505},{t:undefined,h:30,x:322,y:500},]},

];

var colors = ["#b5e3e3","#d6fff1","#fff474","#feb05b","#f88081"];


var animationTime = 2000;
var margin = {top:20,left:220,right:100},
width = $(".graph").width()-80;
console.log(width)
height = 200;


var svg = d3.select(".graph").append("svg")
.attr("width", width)
.attr("height", height)
.attr("border","1px");


$('.drag_box').bind('tap click', function(){
  var dragBoxId = $(this).attr('device-id');
    $(".hoverInfo").remove();

  drawGraph(temp_data[dragBoxId])
  drawGuides();
});

function drawGuides(){

  for(var i = 1; i < 5; i++){
    container.append("g")
    .append("line")
    .attr("stroke-dasharray","5,5")
    .attr("class", "hLine")
    .attr("stroke","#777")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1",height/5 * i )
    .attr("y2",height/5 * i )
  }


  d3.select(".graph").append("div")
  .attr("class","hoverInfo")
  .html("")
  ;

}






function drawGraph(_userData){


  //_userData.
  var target = (_userData.max - _userData.min)/2 + _userData.min;
  console.log(target)
  var x = d3.scale.linear()
  .domain([0,temp_data[0].loc.length])   
  .range([margin.left-180, width]);

  var y = d3.scale.linear()
  .domain([0,target*2 ])  
  .range([height, margin.top]);

  var line = d3.svg.line()
  .x(function(d,i) { return x(i); })
  .y(function(d) {  return y(d.h); });

  var line2 = d3.svg.line()
  .x(function(d,i) { console.log(x(i)); return x(i); })
  .y(function(d) {  return y(d.h); });

  var area = d3.svg.area()
  .x(line2.x())
  .y1(line2.y())
  .y0(y(0));







    //.append("g");
    svg.html('<image xlink:href="imgs/shared/dataBg.jpg" x="0" y="0" preserveAspectRatio="none" width="'+width+'" height="'+height+'" style="clip-path: url(#svgClip); width:'+width+'px;height:'+height+'px"/>');

    var clipPathContainer = svg.append("clipPath")
    .attr("id","svgClip");  




    if($("#lineContainer")){
      console.log('true');
    }
    container = svg.append("g").datum(_userData).attr("id","lineContainer");  

    container.selectAll(".vLine")
    .data( function( d, i ) {  console.log(d.loc);return d.loc; } )  
    .enter()
    .append("line")
    .attr("class", "vLine")
    .attr("x1", line.x())
    .attr("x2", line.x())
    .attr("y1",300 )
    .attr("y2", y(0))
    .transition()
    .duration(animationTime)
    .attr("y2", line.y())
    .attr("r", 10);





    var data = container.selectAll(".dot")
    .data( function( d, i ) { return d.loc; } )
    ;
    data.attr("class","update");

    data.enter()
    .append("circle")
    .attr("class", "dot")
    .on("click", function(d){

      $(".hoverInfo").html(d.h)
    })
    .attr("cx", line.x())
    .attr("cy", y(0))
    .attr("stroke-width","4")
    .attr("stroke","#fff")
    .transition()
    .duration(animationTime)
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 5)
    .attr("svg:title",function(d){return d.h})
    .attr("stroke",function(d){
      heartRate = d.h;
      if(heartRate>= _userData.min && d.h <= _userData.max ){
        return colors[2];
      }else if(heartRate <= _userData.min){
        return colors[0];
      }else if(heartRate >= _userData.max){
        console.log(_userData.min)
        return colors[3];
      }
    });
    data.exit().remove();

    clipPathContainer
    .append("path")
    .datum(_userData.loc)
    .attr("class", "area")
    .attr("d", d3.svg.area()
      .x(x(0))
      .y1(y(0))
      .y0(y(0))
      )
    .transition()
    .duration(animationTime)
    .attr("d", d3.svg.area()
      .x(line2.x())
      .y1(line2.y())
      .y0(y(0))
      )
    .attr("fill","#FFEC38");

  }

