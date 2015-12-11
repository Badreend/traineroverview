var animationTime = 2000;
var margin = {top:20,left:220,right:100},
width = $(".graph").width()-80;
height = 200;


var svg = d3.select(".graph").append("svg")
.attr("width", width)
.attr("height", height)
.attr("border","1px");


  var bpmContainer = d3.select(".graph").append("div")
  .attr("class","hoverInfo")
  .append("div")
  .attr("class","bpm")
  ;

  bpmContainer.append("img").attr("src","/imgs/shared/heart.png");
  bpmContainer.append("h2").html("---");
  bpmContainer.append("p").html("BPM");

function getIndexOfId(_id){
  for(var i = 0 ; i < temp_data.length; i++){
    if(temp_data[i].id === _id){
      return i;
    }
  }
}
function clearInfo(){
  $('#info').empty();
  $('#paths').empty();
  selectedPlayer = undefined;
}

$('.drag_box').bind('tap click', function(){
  var dragBoxId = $(this).attr('device-id');
      var indx = getIndexOfId(parseInt(dragBoxId));
      drawGraph(temp_data[indx])
      drawGuides();

});

function drawGuides(){

  for(var i = 1; i < 5; i++){
    container.append("g")
    .append("line")
    .attr("stroke-dasharray","5,5")
    .attr("class", "hLine")
    .attr("stroke","#689595")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1",height/5 * i )
    .attr("y2",height/5 * i )
  }



}






function drawGraph(_userData){

  //_userData.
  var target = (_userData.max - _userData.min)/2 + _userData.min;
  var x = d3.scale.linear()
  .domain([0,temp_data[0].loc.length])   
  .range([margin.left-180, width-20]);

  var y = d3.scale.linear()
  .domain([0,target*2 ])  
  .range([height, margin.top]);

  var line = d3.svg.line()
  .x(function(d,i) { return x(i); })
  .y(function(d) {  return y(d.h); });

  var line2 = d3.svg.line()
  .x(function(d,i) {  return x(i); })
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
    }
    container = svg.append("g").datum(_userData).attr("id","lineContainer");  

    container.selectAll(".vLine")
    .data( function( d, i ) { ;return d.loc; } )  
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

     // $(".hoverInfo").html('");
      $(".hoverInfo").find("h2").html(d.h);


    })
    .attr("cx", line.x())
    .attr("cy", y(0))
    .attr("stroke-width","4")
    .attr("stroke","#fff")
    .attr("fill","#fff")
    .transition()
    .duration(animationTime)
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 5)
    .attr("fill","#fff")
    .attr("svg:title",function(d){return d.h})
    .attr("stroke",function(d){
      heartRate = d.h;
      if(heartRate>= _userData.min && d.h <= _userData.max ){
        return colors[2];
      }else if(heartRate <= _userData.min){
        if(heartRate <= _userData.min-(target/2)){
            return colors[0];
        }else{
          return colors[1];
        }
      }else if(heartRate >= _userData.max){
        if(heartRate >= _userData.max+(target/2)){
          return colors[4];
        }else{
          return colors[3];
        }
      }
    });
    data.exit().remove();

    clipPathContainer
    .append("path")
    .datum(_userData.loc)
    .attr("class", "area")
    .attr("d", d3.svg.area()
      .x(line2.x())
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

