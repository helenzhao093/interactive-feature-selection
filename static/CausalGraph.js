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
      selectedNode: "",
      selectedEdge: "",
      removedElements: {},
      removeStep: 0
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

    this.state.graphviz = d3.select("#graph").graphviz().zoom(false)
    console.log(this.state.graphviz)
    //console.log(this.state.graphviz['_data'])
    //this.state.graphviz.width("700pt")
    //console.log(this.state.graphviz)
    this.state.graphviz.
      renderDot(this.props.dotSrc)

    //console.log(d3.select('#graph').select('svg').attr("width", 700).attr("height", 500))

    //d3.select('#graph').select('svg').attr("width", 700)
    var dotSrcLines = this.props.dotSrc.split('\n');
    console.log(dotSrcLines)

    var nodes = d3.selectAll('.node')
    var that = this
    nodes
      .on("click", that.nodeClicked)
      .on("mousedown", function(d) {
        console.log(d3.event)
        var x = d3.event.clientX
        var y = d3.event.clientY
        //console.log(x)
        //console.log(y)
        console.log(d)
        console.log(d3.select('.link'))
        var dragline = d3.select(".link")
        dragline.classed("hidden", false)
          //.attr("d", `M${x},${y}L${x},${y}`)
      })
        //that.props.sendData("/nodeSelected", {"nodeStr" : title}))

    var edges = d3.selectAll('.edge')
    edges.
      on("click", that.edgeClicked) /*function(){
        var title = d3.select(this).selectAll('title').text().trim()
        console.log(title)
        that.props.sendData("/edgeSelected", {"edgeStr" : title})
      })*/
    var svg = d3.select('#graph').select('svg')
    svg.attr("width", 700).attr("height", 500)
    svg.append('path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0');

    nodes
      .selectAll("ellipse")
      .attr("rx", 24)
      .attr("ry", 24)
      .attr("stroke", "")
      .attr("fill", "#b9d9ff")

    nodes
      .selectAll("text")
      .attr("font-size", 24)

      d3.select('#graph').select('svg').select("#graph0").select("polygon").attr("fill", "#fbfbfb")
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.selectedEdge != nextState.selectedEdge && this.state.selectedNode != nextState.selectedNode && this.state.markovBlanketSelected != nextState.markovBlanketSelected) {
      return true
    }
    return false
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

    d3.select('#graph').select('svg').attr("width", 700).attr("height", 500)
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
    const edgeClasses = ["selected-edgeto", "selected-edgefrom", "selected-spouseedge", "selected-pathto"]
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
    this.state.selectedEdge = '#edge' + (edge - 1)
    this.state.isEdgeSelected = true;
    this.state.isNodeSelected = false;
  }

  nodeClicked(element) {
      if (d3.event.defaultPrevented) return;
      this.state.selectedEdge = ""
      this.removeEdgeClass()
      this.removeNodeClass()

      const nodeInfo = this.props.graph[element.key]
      console.log(element)
      console.log(nodeInfo)
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
      this.state.selectedNode = element.key
      this.state.isNodeSelected = true;
      this.state.isEdgeSelected = false;
  }

  removeSelected() {
    //this.props.sendData("/removeSelected", {"data": "-1"})
    this.removeNodeClass()
    this.removeEdgeClass()
    this.state.removeStep = this.state.removeStep + 1
    if (this.state.isEdgeSelected) {
      d3.select(this.state.selectedEdge).raise().classed("removed", true);
      this.state.removedElements[this.state.removeStep] = {element: this.state.selectedEdge, type: "edge" }
      this.state.selectedEdge = ""
      //console.log(this.state)
    }
    if (this.state.isNodeSelected) {
      this.state.selectedNode.edgeFrom.map((edge) => {
        const elementId = '#edge' + (edge - 1).toString();
        d3.select(elementId).raise().classed("removed", true);
      })
      Object.keys(this.state.selectedNode.edgeTo).map((toNode) => {
        const elementId = '#edge' + (this.state.selectedNode.edgeTo[toNode] - 1).toString()
        d3.select(elementId).raise().classed("removed", true);
      })
      this.state.removedElements[this.state.removeStep] = {element: this.state.selectedNode, type: "node" }
      this.state.selectedNode = ""
    }
    console.log(this.state)
  }

  undo() {
    if (this.state.removeStep > 0) {
      const removedElement = this.state.removedElements[this.state.removeStep]
      if (removedElement.type == 'edge') {
        d3.select(removedElement.element).classed("removed", false);
      } else {
        removedElement.element.edgeFrom.map(edge => {
          const elementId = '#edge' + (edge - 1).toString();
          d3.select(elementId).classed("removed", false);
        })
        Object.keys(removedElement.element.edgeTo).map((toNode) => {
          const elementId = '#edge' + (removedElement.element.edgeTo[toNode] - 1).toString()
          d3.select(elementId).classed("removed", false);
        })
      }
      delete this.state.removedElements[this.state.removeStep]
      this.state.removeStep = this.state.removeStep - 1
    }
  }

  clear() {
    d3.selectAll('.edge').classed("removed", false);
    this.state.removedElements = {}
  }

  render(){
    console.log('graph')
    console.log(this.state)
    //var blanket = this.state.markovBlanketSelected ? "turquoise" : "white";
    //var path = this.state.markovBlanketSelected ? "white" : "turquoise";
    //style={{display: this.state.showStore ? 'block' : 'none' }}
    return (
      <div className={"column"} width={700} height={500}>
        <button onClick={() => this.updateGraphSelection(this.state.markovBlanket) }>
          {this.state.markovBlanket}</button>
        <button onClick={() => this.updateGraphSelection(this.state.pathToFromTarget)}>
        {this.state.pathToFromTarget}</button>
        <button onClick={() => this.removeSelected()}>
          {"Remove"}
        </button>

        <button onClick={() => this.undo()}>
          {"Undo"}
        </button>
        <button onClick={() => this.clear()}>
          {"Clear"}
        </button>
        <div id={"graph"} style={{textAlign: "center"}}/>
      </div>
    )
  }
}
/*<object id="causalGraph" data={this.props.data} type="image/svg+xml" height={600} width={600}>
  {"Your browser doesn't support SVG"}
</object>

disabled={!this.state.isEdgeSelected || !this.state.isNodeSelected}>*/
