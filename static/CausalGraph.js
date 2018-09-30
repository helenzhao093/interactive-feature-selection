class CausalGraph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanket: "Markov Blanket",
      pathToFromTarget: "Path to/from Target",
      isEdgeSelected: false,
      isNodeSelected: false,
      markovBlanketSelected: true,
      selectedNode: ""
    }
    this.updateGraphSelection = this.updateGraphSelection.bind(this)
    this.removeSelected = this.removeSelected.bind(this)
    this.nodeClicked = this.nodeClicked.bind(this)
    this.edgeClicked = this.edgeClicked.bind(this)
    this.removeNodeClass = this.removeNodeClass.bind(this)
    this.removeEdgeClass = this.removeEdgeClass.bind(this)
  }

  componentDidMount() {

    var transition1 = d3.transition()
        .delay(100)
        .duration(1000);

    this.state.graphviz = d3.select("#graph").graphviz()
    this.state.graphviz.
      transition(transition1).
      renderDot(this.props.dotSrc)

    var dotSrcLines = this.props.dotSrc.split('\n');
    console.log(dotSrcLines)

    var nodes = d3.selectAll('.node')
    var that = this
    nodes.
      on("click", that.nodeClicked)
        //that.props.sendData("/nodeSelected", {"nodeStr" : title}))

    var edges = d3.selectAll('.edge')
    edges.
      on("click", that.edgeClicked) /*function(){
        var title = d3.select(this).selectAll('title').text().trim()
        console.log(title)
        that.props.sendData("/edgeSelected", {"edgeStr" : title})
      })*/
  }

  componentDidUpdate() {
    //console.log(this.props)
    //d3.select("#graph").graphviz()
    var transition1 = d3.transition()
        .delay(100)
        .duration(1000);
    this.state.graphviz
      .transition(transition1)
      .renderDot(this.props.dotSrc);
  }

  updateGraphSelection(selected) {
    console.log(selected)
    if (selected == this.state.pathToFromTarget && this.state.markovBlanketSelected == true) {
      //this.props.sendData("/toggleGraphSelection", {"data": "-1"})
      this.state.markovBlanketSelected = false
    }
    if (selected == this.state.markovBlanket && this.state.markovBlanketSelected == false) {
      //this.props.sendData("/toggleGraphSelection", {"data": "-1"})
      this.state.markovBlanketSelected = true
    }
    if (this.state.selectedNode != "") {
      this.nodeClicked({key: this.state.selectedNode})
    }
  }

  removeNodeClass() {
    const nodeClasses = ["selected-node", "selected-nodefrom", "selected-nodeto", "selected-spousenode"]
    for (var i = 0; i < nodeClasses.length; i++) {
      d3.selectAll('.node').classed(nodeClasses[i], false);
    }
  }

  removeEdgeClass() {
    const edgeClasses = ["selected-edgeto", "selected-edgefrom", "selected-spouseedge"]
    for (var i = 0; i < edgeClasses.length; i++) {
      d3.selectAll('.edge').classed(edgeClasses[i], false);
    }
  }

  edgeClicked(element) {
    this.state.selectedNode = ""
    this.removeEdgeClass()
    this.removeNodeClass()
    var nodes = element.key.split("->")
    console.log(nodes)
    const nodeInfo = this.props.graph[nodes[0]]
    const nodeFromIndex = nodeInfo.nodeIndex
    const nodeToIndex = this.props.graph[nodes[1]].nodeIndex
    var edge;
    if (nodeInfo.edgeTo[nodes[1]]) {
      edge = nodeInfo.edgeTo[nodes[1]]
    } else {
      edge = this.props.graph[nodes[1]].edgeTo[nodes[0]]
    }
    console.log(edge-1)
    /*for (var i = 0; i < nodeInfo.nodeTo.length; i++) {
      //console.log(nodeInfo.nodeTo[i])
      //console.log(nodeToIndex)
      console.log(nodeToIndex == nodeInfo.nodeTo[i])
      if (nodeInfo.nodeTo[i] == nodeToIndex) {
        //const edge = nodeInfo.edgeTo[i]
        console.log(nodeInfo.edgeTo)
        d3.select('#edge' + (edge - 1).toString()).raise().classed("selected-edgeto", true)
        //edge = nodeInfo.edgeTo[i];
        break;
      }
    }*/

    d3.select('#node' + nodeFromIndex.toString()).raise().classed("selected-nodeto", true)
    d3.select('#node' + nodeToIndex.toString()).raise().classed("selected-nodeto", true)
    d3.select('#edge' + (edge - 1).toString()).raise().classed("selected-edgeto", true)
    this.state.isEdgeSelected = true;
    this.state.isNodeSelected = false;
  }

  nodeClicked(element) {
      this.removeEdgeClass()
      this.removeNodeClass()

      const nodeInfo = this.props.graph[element.key]
      this.state.selectedNode = element.key
      if (this.state.markovBlanketSelected) {
        Object.keys(nodeInfo.edgeTo).map((toNode) => {
          const elementId = '#edge' + (nodeInfo.edgeTo[toNode] - 1).toString()
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-edgeto", true);
        })

        nodeInfo.edgeFrom.map((edge) => {
          const elementId = '#edge' + (edge - 1).toString();
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-edgefrom", true);
        })

        nodeInfo.nodeTo.map((node) => {
          const elementId = '#node' + node;
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-nodeto", true);
        })

        nodeInfo.nodeFrom.map((node) => {
          const elementId = '#node' + node
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-nodefrom", true);
        })

        nodeInfo.spouseNode.map((node) => {
          const elementId = '#node' + node
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-spousenode", true);
        })

        nodeInfo.spouseEdge.map((edge) => {
          const elementId = '#edge' + (edge - 1).toString();
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-spouseedge", true);
        })
      } else {
        nodeInfo.paths.map(edge => {
          const elementId = '#edge' + (edge - 1).toString();
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-pathto", true);
        })
        nodeInfo.pathNodes.map(node => {
          const elementId = '#node' + node
          console.log(elementId)
          d3.select(elementId).raise().classed("selected-node", true);
        })
      }
      const selectedNodeId = '#node' + nodeInfo.nodeIndex
      d3.select(selectedNodeId).raise().classed("selected-node", true);
      this.state.isNodeSelected = true;
      this.state.isEdgeSelected = false;
  }

  removeSelected() {
    this.props.sendData("/removeSelected", {"data": "-1"})
  }

  render(){
    console.log('graph')
    //var blanket = this.state.markovBlanketSelected ? "turquoise" : "white";
    //var path = this.state.markovBlanketSelected ? "white" : "turquoise";
    //style={{display: this.state.showStore ? 'block' : 'none' }}
    return (
      <div>
        <button onClick={() => this.updateGraphSelection(this.state.markovBlanket) }>
          {this.state.markovBlanket}</button>
        <button onClick={() => this.updateGraphSelection(this.state.pathToFromTarget)}>
        {this.state.pathToFromTarget}</button>
        <button onClick={() => this.removeSelected()}
          disabled={this.state.isEdgeSelected || this.state.isNodeSelected}>
          {"Remove"}
        </button>
        <div id={"graph"} style={{textAlign: "center"}}/>
      </div>
    )
  }
}
/*<object id="causalGraph" data={this.props.data} type="image/svg+xml" height={600} width={600}>
  {"Your browser doesn't support SVG"}
</object>*/
