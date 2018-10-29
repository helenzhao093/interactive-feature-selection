class CausalGraph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      markovBlanket: "Markov Blanket",
      pathToFromTarget: "Path to/from Target",
      isEdgeSelected: false,
      isNodeSelected: false,
      markovBlanketSelected: true,
      selectedNode: "",
      selectedEdge: "",
      selectedEdgeFromTo: [],
      removedElements: {},
      removeStep: 0,
      removedEdges: [] //[from, to]
    }
    this.renderGraph = this.renderGraph.bind(this);
    this.updateGraphSelection = this.updateGraphSelection.bind(this);
    this.removeSelected = this.removeSelected.bind(this)
    this.nodeClicked = this.nodeClicked.bind(this)
    this.edgeClicked = this.edgeClicked.bind(this)
    this.removeNodeClass = this.removeNodeClass.bind(this);
    this.removeEdgeClass = this.removeEdgeClass.bind(this);
    this.removedEdgeFromGraph = this.removedEdgeFromGraph.bind(this);
    this.addRemovedEdgeToGraph = this.addRemovedEdgeToGraph.bind(this);
  }

  renderGraph() {
      this.state.graphviz.
        renderDot(this.props.dotSrc);

      var nodes = d3.selectAll('.node');
      var that = this;
      nodes
          .on("click", that.nodeClicked)
          .on("mousedown", function(d) {
              console.log(d3.event);
              var x = d3.event.clientX;
              var y = d3.event.clientY;
              //console.log(x)
              //console.log(y)
              //console.log(d)
              //console.log(d3.select('.link'))
              //var dragline = d3.select(".link")
              //dragline.classed("hidden", false)
              //.attr("d", `M${x},${y}L${x},${y}`)
          });

      var edges = d3.selectAll('.edge');
      edges.
        on("click", that.edgeClicked);

      var svg = d3.select('#graph').select('svg');

      nodes
          .selectAll("ellipse")
          .attr("rx", 24)
          .attr("ry", 24)
          .attr("stroke", "")
          .attr("fill", "#b9d9ff");

      nodes
          .selectAll("text")
          .attr("font-size", 24);

      d3.select('#graph').select('svg').select("#graph0").select("polygon").attr("fill", "#fbfbfb")
      svg.attr("width", 800).attr("height", 500)
      //console.log(this.state.removedElements)
      //console.log(this.state.removeStep)
      var step = this.state.removeStep
      //console.log(this.state.removedElements[step])
      var that = this;
      while (step > 0 && that.state.removedElements[step].type == 'edge') {
          d3.select(that.state.removedElements[step].element).raise().classed("removed", true);
          step = step - 1;
      }
  }

  componentDidMount() {

    /*var transition1 = d3.transition()
        .delay(100)
        .duration(1000); */

    this.state.graphviz = d3.select("#graph").graphviz().zoom(false)
    this.renderGraph()
  }

  /*shouldComponentUpdate(nextProps, nextState) {

    if (this.props.dotSrc != nextProps.dotSrc && this.state.selectedEdge != nextState.selectedEdge && this.state.selectedNode != nextState.selectedNode && this.state.markovBlanketSelected != nextState.markovBlanketSelected) {
      return true
    }
    return false
  }*/

  componentDidUpdate() {
    console.log('update causal graph')
    console.log(this.props)
    this.renderGraph()

    //d3.select('#graph').select('svg').attr("width", 700).attr("height", 500)
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

  removedEdgeFromGraph(edgeFromTo) {
    const nodeFrom = edgeFromTo[0];
    const nodeFromIndex = this.props.graph[nodeFrom].nodeIndex
    const nodeTo = edgeFromTo[1];
    const nodeToIndex = this.props.graph[nodeTo].nodeIndex

    const elementIndex = this.props.graph[nodeFrom].nodeTo.indexOf(nodeToIndex)
    this.props.graph[nodeFrom].nodeTo.splice(elementIndex, 1)
    delete this.props.graph[nodeFrom].edgeTo[nodeTo]

    const index = this.props.graph[nodeTo].nodeFrom.indexOf(nodeFromIndex)
    this.props.graph[nodeTo].nodeFrom.splice(index, 1)
    this.props.graph[nodeTo].edgeFrom.splice(index, 1)
    console.log(this.props.graph[nodeFrom])
    console.log(this.props.graph[nodeTo])
  }

  addRemovedEdgeToGraph(edgeFromTo, edgeId) {
      const nodeFrom = edgeFromTo[0];
      const nodeFromIndex = this.props.graph[nodeFrom].nodeIndex
      const nodeTo = edgeFromTo[1];
      const nodeToIndex = this.props.graph[nodeTo].nodeIndex

      //const elementIndex = this.state.graph[nodeFrom].nodeTo.indexOf(nodeToIndex)
      this.props.graph[nodeFrom].nodeTo.push(nodeToIndex)
      this.props.graph[nodeFrom].edgeTo[nodeTo] = parseInt(edgeId.slice(5)) + 1

      //const index = this.state.graph[nodeTo].nodeFrom.indexOf(nodeFromIndex)
      this.props.graph[nodeTo].nodeFrom.push(nodeFromIndex)
      this.props.graph[nodeTo].edgeFrom.push(parseInt(edgeId.slice(5)) + 1)
      console.log(this.props.graph[nodeFrom])
      console.log(this.props.graph[nodeTo])
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
    var nodeFrom;
    var nodeTo;
    if (nodeInfo.edgeTo[nodes[1]]) {
      edge = nodeInfo.edgeTo[nodes[1]]
      nodeFrom = nodes[0]
      nodeTo = nodes[1]
    } else {
      edge = this.props.graph[nodes[1]].edgeTo[nodes[0]]
      nodeFrom = nodes[1]
      nodeTo = nodes[0]
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
    this.state.selectedEdgeFromTo = [nodeFrom, nodeTo]
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
    this.removeNodeClass();
    this.removeEdgeClass();
    this.state.removeStep = this.state.removeStep + 1
    if (this.state.isEdgeSelected) {
      d3.select(this.state.selectedEdge).raise().classed("removed", true);
      this.state.removedElements[this.state.removeStep] = {element: this.state.selectedEdge, type: "edge", edgeFromTo: this.state.selectedEdgeFromTo }
      this.state.selectedEdge = ""
      this.removedEdgeFromGraph(this.state.selectedEdgeFromTo)
        //console.log(this.state)
    }
    if (this.state.isNodeSelected) {
      console.log(this.state.selectedNode)
      const nodeInfo = this.props.graph[this.state.selectedNode]
        nodeInfo.edgeFrom.map((edge) => {
        const elementId = '#edge' + (edge - 1).toString();
        d3.select(elementId).raise().classed("removed", true);
      });
      Object.keys(nodeInfo.edgeTo).map((toNode) => {
        const elementId = '#edge' + (nodeInfo.edgeTo[toNode] - 1).toString();
        d3.select(elementId).raise().classed("removed", true);
      });
      this.state.removedElements[this.state.removeStep] = {element: this.state.selectedNode, type: "node" };
      const removedNode = this.state.selectedNode;
      this.state.selectedNode = "";
      this.props.sendData("/redrawGraph", {features: [removedNode], removedEdges: this.state.removedEdges } )
    }
    //console.log(this.state)
  }

  undo() {
    if (this.state.removeStep > 0) {
      const removedElement = this.state.removedElements[this.state.removeStep]
      if (removedElement.type == 'edge') {
          d3.select(removedElement.element).classed("removed", false);
          this.addRemovedEdgeToGraph(removedElement.edgeFromTo, removedElement.element)
          delete this.state.removedElements[this.state.removeStep]
          this.state.removeStep = this.state.removeStep - 1
      } else {
          delete this.state.removedElements[this.state.removeStep]
          this.state.removeStep = this.state.removeStep - 1
          this.props.undoNodeRemoval(removedElement.element)
          //console.log("hi")
        /*removedElement.element.edgeFrom.map(edge => {
          const elementId = '#edge' + (edge - 1).toString();
          d3.select(elementId).classed("removed", false);
        })
        Object.keys(removedElement.element.edgeTo).map((toNode) => {
          const elementId = '#edge' + (removedElement.element.edgeTo[toNode] - 1).toString()
          d3.select(elementId).classed("removed", false);
        }) */
      }

    }
  }

  clear() {
    //d3.selectAll('.edge').classed("removed", false);
    this.state.removedElements = {}
    this.props.clearGraph()
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
