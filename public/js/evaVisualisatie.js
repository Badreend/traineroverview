temp_data = [
{id:1,name:"Momo Niek",diagnose:"Diagnose: knie & rug",min:90,max:135,loc:[{t:undefined,h:40,x:500,y:450},{t:undefined,h:150,x:450,y:435},{t:undefined,h:110,x:432,y:455},{t:undefined,h:120,x:422,y:510},{t:undefined,h:140,x:390,y:450},{t:undefined,h:145,x:380,y:470},{t:undefined,h:70,x:362,y:505},{t:undefined,h:30,x:322,y:500},]},
{id:1,name:"Momo Niek",diagnose:"Diagnose: knie & rug",min:90,max:135,loc:[{t:undefined,h:40,x:500,y:450},{t:undefined,h:150,x:450,y:435},{t:undefined,h:110,x:432,y:455},{t:undefined,h:120,x:422,y:510},{t:undefined,h:140,x:390,y:450},{t:undefined,h:145,x:380,y:470},{t:undefined,h:70,x:362,y:505},{t:undefined,h:30,x:322,y:500},]},
{id:1,name:"Momo Niek",diagnose:"Diagnose: knie & rug",min:90,max:135,loc:[{t:undefined,h:40,x:500,y:450},{t:undefined,h:150,x:450,y:435},{t:undefined,h:110,x:432,y:455},{t:undefined,h:120,x:422,y:510},{t:undefined,h:140,x:390,y:450},{t:undefined,h:145,x:380,y:470},{t:undefined,h:70,x:362,y:505},{t:undefined,h:30,x:322,y:500},]},

];

drawGraph(); 

function drawGraph(){
  var margin = {top:20,left:220,right:100},
  width = 900,
  height = 300;

  var x = d3.scale.linear()
  .domain([0,temp_data[0].loc.length])   
  .range([margin.left-120, width]);

  var y = d3.scale.linear()
  .domain([0,d3.max(temp_data[0].loc, function(d) { return d.h} )])  
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

  var svg = d3.select(".graph").append("svg")
      //.datum(data)
      .attr("width", width)
      .attr("height", height)
      .attr("border","1px");


    //.append("g");
    svg.html('<image xlink:href="imgs/shared/dataBg.jpg" x="0" y="0" width="900" height="300" style="clip-path: url(#svgClip);"/>');

    var lines = svg.selectAll( "g" )
    .data( temp_data );  

    var container = svg.append("g").data(temp_data).attr("id","lineContainer");  


    var clipPathContainer = svg.append("clipPath")
    .attr("id","svgClip");  

    container.selectAll(".vLine")
    .data( function( d, i ) {  console.log(d.loc);return d.loc; } )  
    .enter()
    .append("line")
    .attr("class", "vLine")
    .attr("x1", line.x())
    .attr("x2", line.x())
    .attr("y1",300 )
    .attr("y2", line.y())
    .attr("r", 10);

    container.selectAll(".dot")
    .data( function( d, i ) { return d.loc; } )  
    .enter()
    .append("circle")
    .attr("class", "dot")
    .on("click", function(d){

      $(".hoverInfo").html(d.h)
    })
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 7)
    .attr("svg:title",function(d){return d.h})
    .attr("fill",function(d){
      if(d.h < 100){
        return "#F7F73B";
      }else{
        return "#F7423B";
      }
    });
    clipPathContainer.append("path")
    .datum(temp_data[0].loc)

    .attr("class", "area")
    .attr("d", d3.svg.area()
      .x(line2.x())
      .y1(line2.y())
      .y0(y(0))
      )
    .attr("fill","#FFEC38");

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
    .html("1.4 Km / 00:04")
    ;

  }

