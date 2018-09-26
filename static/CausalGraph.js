class CausalGraph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanket: "Markov Blanket",
      pathToFromTarget: "Path to/from Target"
    }
    this.updateGraphSelection = this.updateGraphSelection.bind(this)
  }

  componentDidMount() {
    //var a = document.getElementsByClassName("edge")
    //console.log(a)
    //.addEventListener(this.clickEdge)

    var transition1 = d3.transition()
        .delay(100)
        .duration(1000);

    this.state.graphviz = d3.select("#graph").graphviz()
    this.state.graphviz.
      transition(transition1).
      renderDot(this.props.dotSrc)

    var dotSrcLines = this.props.dotSrc.split('\n');
    console.log(dotSrcLines)

    var nodes = d3.selectAll('.node,.edge')
    var that = this
    nodes.
      on("click", function(){
        var title = d3.select(this).selectAll('title').text().trim()
        console.log(title)
        /*var id = d3.select(this).attr('id');
        console.log(id)
        var class1 = d3.select(this).attr('class');
        console.log(class1);
        var dotElement = title.replace('->', ' -> ')
        dotSrcLines = dotSrcLines.map((line) => {
          if (line.indexOf(dotElement) >= 0) {
            return line.replace(/];/gi, " color=\"0.650 0.200 1.000\"];");
          } else {
            return line;
          }
        });
        var dotSrc = dotSrcLines.join('\n');*/

        that.props.sendData("/nodeSelected", {"nodeStr" : title})


      })
  }

  componentDidUpdate() {
    //console.log(this.props)
    //d3.select("#graph").graphviz()
    this.state.graphviz
      .renderDot(this.props.dotSrc);
  }

  /*shouldComponentUpdate(nextProps, nextState){
   return nextState.dotSrc != this.state.dotSrc; // equals() is your implementation
 }*/

  updateGraphSelection(selected) {
    console.log(selected)
    if (selected == this.state.pathToFromTarget && this.props.markovBlanketSelected == true) {
      this.props.sendData("/toggleGraphSelection", {"data": "-1"})
    }
    if (selected == this.state.markovBlanket && this.props.markovBlanketSelected == false) {
      this.props.sendData("/toggleGraphSelection", {"data": "-1"})
    }
  }

  render(){
    console.log('graph')
    var blanket = this.props.markovBlanketSelected ? "turquoise" : "white";
    var path = this.props.markovBlanketSelected ? "white" : "turquoise";
    return (
      <div>
        <button onClick={() => this.updateGraphSelection(this.state.markovBlanket) }
          style={{background: blanket}}>{this.state.markovBlanket}</button>
        <button onClick={() => this.updateGraphSelection(this.state.pathToFromTarget)}
          style={{background: path}}>{this.state.pathToFromTarget}</button>
        <div id={"graph"} style={{textAlign: "center"}}/>
      </div>
    )
  }
}
/*<object id="causalGraph" data={this.props.data} type="image/svg+xml" height={600} width={600}>
  {"Your browser doesn't support SVG"}
</object>*/
