class CausalGraph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
        graphviz: null,
      addEdge: false,
      markovBlanket: "Markov Blanket of Selected",
      pathToFromTarget: "Path to/from Target",
      isEdgeSelected: false,
      isNodeSelected: false,
      markovBlanketSelected: true,
      selectedNode: "",
      selectedEdge: "",
      selectedEdgeFromTo: [],
      removeStep: 0,
      removedEdges: [],
      edits: [],
      legendMB: [
          { value: "Selected Node", color: "yellow", helptext: "selected feature that the other highlighted nodes are relate to" },
          { value: "Parent", color:'#ffae42', helptext: "features that are direct causes of the selected feature"},
          { value: "Child", color:'yellowgreen', helptext: "features that are direct effects of the selected feature" },
          { value: "Spouse", color: "#0d98ba", helptext: "features that are also direct causes of the selected feature's children/direct effects" },
          { value: "Selected Edge", color: "darkorange", helptext: "selected edge"}
      ],
      legendPath: [
          { value: "Selected Node", color: "yellow", helptext: "selected feature that the other highlighted nodes are relate to" },
          { value: "Path From", color: "#ffae42", helptext: "Path from selected node to the target" },
          { value: "Path To", color: "yellowgreen", helptext: "Path to the target from the selected node"},
          { value: "Selected Edge", color: "darkorange", helptext: "selected edge"}
      ]
    };
    this.renderGraph = this.renderGraph.bind(this);
    this.updateGraphSelection = this.updateGraphSelection.bind(this);
    this.removeSelected = this.removeSelected.bind(this);
    this.nodeClicked = this.nodeClicked.bind(this);
    this.edgeClicked = this.edgeClicked.bind(this);
    this.removeNodeClass = this.removeNodeClass.bind(this);
    this.removeEdgeClass = this.removeEdgeClass.bind(this);
    this.removedEdgeFromGraph = this.removedEdgeFromGraph.bind(this);
    this.addRemovedEdgeToGraph = this.addRemovedEdgeToGraph.bind(this);
    this.sendEdgeRemoved = this.sendEdgeRemoved.bind(this);
    this.addClassToElements = this.addClassToElements.bind(this);
    this.undo = this.undo.bind(this);
  }

  renderGraph() {

      if (this.props.dotSrc) {
          this.state.graphviz.renderDot(this.props.dotSrc);
          var element = document.getElementById('graph-overlay');
          element.style.visibility = "hidden";


          var nodes = d3.selectAll('.node');
          var that = this;
          nodes
              .on("click", that.nodeClicked);

          var edges = d3.selectAll('.edge');
          edges.on("click", that.edgeClicked);

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

          d3.select('#graph').select('svg').select("#graph0").select("polygon");
          let targetId = "#node" + String(this.props.graph[this.props.targetName].nodeIndex);
          d3.select(targetId).select('ellipse').attr("stroke", "royalblue").attr("stroke-width", 2);

          svg.attr("width", 800).attr("height", 500);
      }
  }

  componentDidMount() {
    this.state.graphviz = d3.select("#graph").graphviz().zoom(false);
    this.renderGraph()
  }


  shouldComponentUpdate(nextProps, nextState) {
      return !(nextProps.dotSrc == this.props.dotSrc) || !(nextState.markovBlanketSelected == this.state.markovBlanketSelected) || (nextState.addEdge != this.state.addEdge);
  }

  componentDidUpdate() {
      var element = document.getElementById('graph-overlay');
      element.style.visibility = "hidden";
      this.renderGraph()
  }

  updateGraphSelection(selected) {
    if (selected == this.state.pathToFromTarget && this.state.markovBlanketSelected == true) {
      this.setState({
          markovBlanketSelected: false
      });
      //this.state.markovBlanketSelected = false;
    }
    if (selected == this.state.markovBlanket && this.state.markovBlanketSelected == false) {
        this.setState({
            markovBlanketSelected: true
        });
    }
    if (this.state.selectedNode != "") {
      this.nodeClicked({key: this.state.selectedNode})
    }
  }

  removeNodeClass() {
    const nodeClasses = ["selected-node", "selected-nodefrom", "selected-nodeto", "selected-spousenode", "selected-pathnode", "selected-edgenode"];
    for (var i = 0; i < nodeClasses.length; i++) {
      d3.selectAll('.node').classed(nodeClasses[i], false);
    }
  }

  removeEdgeClass() {
    const edgeClasses = ["selected-edgeto", "selected-edgefrom", "selected-spouseedge", "selected-pathto", "selected-pathedge", "selected-edge"];
    for (var i = 0; i < edgeClasses.length; i++) {
      d3.selectAll('.edge').classed(edgeClasses[i], false);
    }
  }

  sendEdgeRemoved(nodeFrom, nodeTo) {
      fetch('/removedEdge', {
          method: 'POST',
          body: JSON.stringify({ nodeFrom: nodeFrom, nodeTo: nodeTo })
      }).then(function(response) {
          return response.json();
      }).then(data => {
      }).catch(function(error) {
          console.log(error)
      })
  }

  removedEdgeFromGraph(nodeFrom, nodeTo) {
    var graph = this.props.getGraphDataToLog(this.props.graph);
    client.recordEvent('graph_history', {
        user: userID,
        edit: "remove_edge",
        info: [nodeFrom, nodeTo],
        graph: graph
    });

    this.props.sendData("/removeEdge", { nodeFrom: nodeFrom, nodeTo: nodeTo });

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
    //console.log(nodes)
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

    client.recordEvent('causal_graph_clicks', {
        user: userID,
        type: "edge",
        info: [nodeFrom, nodeTo]
    });

    d3.select('#node' + nodeFromIndex.toString()).raise().classed("selected-edgenode", true)
    d3.select('#node' + nodeToIndex.toString()).raise().classed("selected-edgenode", true)
    d3.select('#edge' + (edge).toString()).raise().classed("selected-edge", true)
    this.state.selectedEdge = '#edge' + (edge);
    this.state.selectedEdgeFromTo = [nodeFrom, nodeTo];
    this.state.isEdgeSelected = true;
    this.state.isNodeSelected = false;
  }

  addClassToElements(elements, idPreFix, newClass) {
      elements.map((element) => {
          const elementId = idPreFix + element;
          d3.select(elementId).raise().classed(newClass, true);
      })
  }

  nodeClicked(element) {
      this.state.selectedEdge = "";
      this.removeEdgeClass();
      this.removeNodeClass();

      const nodeInfo = this.props.graph[element.key];
      const selectedNodeId = '#node' + nodeInfo.nodeIndex;
      d3.select(selectedNodeId).raise().classed("selected-node", true);

      if (this.state.addEdge) {
          if (this.state.selectedNode != "") {
              //d3.selectAll(".edge").classed("removed", false);
              const firstNode = this.state.selectedNode;
              const secondNode = element.key;
              this.state.selectedNode = "";
              this.state.addEdge = false;
              this.state.edits.push({ "type": "addEdge", "data": [firstNode, secondNode] });
              this.props.sendData("/addEdge", {"nodeFrom": firstNode, "nodeTo": secondNode });
          } else {
              this.state.selectedNode = element.key;
          }
      }
      else if (this.state.markovBlanketSelected) {
        Object.keys(nodeInfo.edgeTo).map((toNode) => {
          const elementId = '#edge' + (nodeInfo.edgeTo[toNode]).toString()
          //console.log(elementId)
          d3.select(elementId).raise().classed("selected-edgeto", true);
        });

        this.addClassToElements(nodeInfo.edgeFrom, '#edge', "selected-edgefrom");
        this.addClassToElements(nodeInfo.nodeFrom, '#node', "selected-nodefrom");
        this.addClassToElements(nodeInfo.nodeTo, '#node', "selected-nodeto");
        this.addClassToElements(nodeInfo.spouseNode, '#node', "selected-spousenode");
        this.addClassToElements(nodeInfo.spouseEdge, '#edge', "selected-spouseedge");
          client.recordEvent('causal_graph_clicks', {
              user: userID,
              type: "node",
              info: element.key,
              markovBlanket: this.state.markovBlanketSelected
          });

          this.state.selectedNode = element.key;
          this.state.isNodeSelected = true;
          this.state.isEdgeSelected = false;
      } else { //path to/from target selected
          this.addClassToElements(nodeInfo.paths, '#edge', "selected-edgeto");
          this.addClassToElements(nodeInfo.pathNodes, '#node', "selected-nodeto");
          this.addClassToElements(nodeInfo.pathsFrom, '#edge', "selected-edgefrom");
          this.addClassToElements(nodeInfo.pathNodesFrom, '#node', "selected-nodefrom");

          client.recordEvent('causal_graph_clicks', {
              user: userID,
              type: "node",
              info: element.key,
              markovBlankeView: this.state.markovBlanketSelected
          });

          this.state.selectedNode = element.key;
          this.state.isNodeSelected = true;
          this.state.isEdgeSelected = false;
      }
  }

  undo() {
      var lastEdit = this.state.edits.pop();
      if (lastEdit.type == 'removedEdges') {
          this.state.removedEdges.splice(this.state.removedEdges.indexOf(lastEdit.data), 1)
      }
      this.props.undo(lastEdit);
  }

  removeSelected() {
    this.removeNodeClass();
    this.removeEdgeClass();
    this.state.removeStep = this.state.removeStep + 1;
    if (this.state.isEdgeSelected) {
      //this.state.removedElements[this.state.removeStep] = {element: this.state.selectedEdge, type: "edge", edgeFromTo: this.state.selectedEdgeFromTo };
      this.state.removedEdges.push(this.state.selectedEdgeFromTo);
      this.state.edits.push({ "type": "removeEdge", "data": this.state.selectedEdgeFromTo });
      this.state.selectedEdge = "";
      this.removedEdgeFromGraph(this.state.selectedEdgeFromTo[0], this.state.selectedEdgeFromTo[1])
    }
    if (this.state.isNodeSelected) {
      var element = document.getElementById('graph-overlay');
      element.style.visibility = "visible";
      //this.state.removedElements[this.state.removeStep] = {element: this.state.selectedNode, type: "node" };
      this.state.edits.push({ "type": "removeNode", "data": this.state.selectedNode });
      const removedNode = this.state.selectedNode;
      this.state.selectedNode = "";
      this.props.sendData("/redrawGraph", {features: [removedNode], removedEdges: this.state.removedEdges });
    }
  }

  clear() {
    //this.state.removedElements = {};
    this.props.clearGraph()
  }

  toggleAddEdge() {
      this.state.selectedNode = "";
      this.setState({
          addEdge: !this.state.addEdge
      });
  }

  render(){
    console.log('graph');
    console.log(this.props);
    var colorMB = this.state.markovBlanketSelected ? "yellowgreen" : "darkgray";
    var legend = (this.state.markovBlanketSelected) ? this.state.legendMB : this.state.legendPath;
    return (
      <div width={700} height={500}>
          <div className={"tools-bar"}>
            <button className={"tools-bar action-button"} onClick={() => this.updateGraphSelection(this.state.markovBlanket)} style={{ background:  colorMB}}>
              {this.state.markovBlanket}
              </button>
              <div className={"tools-bar-help"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <span className={"tools-bar-help-text"}>
                      {"Highlights the set of nodes (markov blanket) that cuts the selected node from the rest of the graph."}
                  </span>
              </div>
            <button className={"tools-bar action-button"} onClick={() => this.updateGraphSelection(this.state.pathToFromTarget)} style={{ background: this.state.markovBlanketSelected ? "darkgray" : "yellowgreen" }}>
            {this.state.pathToFromTarget}
            </button>
              <div className={"tools-bar-help"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <span className={"tools-bar-help-text"}>
                      {"Highlights the path from the selected node to the target node"}
                  </span>
              </div>
            <button className={"tools-bar action-button"} onClick={() => this.removeSelected()}>
              {"Remove"}
            </button>
              <div className={"tools-bar-help"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <span className={"tools-bar-help-text"}>
                      {"Select a node or edge in the graph. Click remove to rerender the graph without the node/edge."}
                  </span>
              </div>
              <button className={this.state.addEdge ? "tools-bar action-button add-edge": "tools-bar action-button"} onClick={() => this.toggleAddEdge()}>{"Add Edge"}</button>
              <div className={"tools-bar-help"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <span className={"tools-bar-help-text"}>
                      {"Click on button to enable adding edges. Click on the node the edge is coming from and then click on the node the edge is going to"}
                  </span>
              </div>
              <button className={"tools-bar action-button"} onClick={ this.undo }>
              {"Undo"}
            </button>
            <button className={"tools-bar action-button"} onClick={() => this.clear()}>
              {"Clear"}
            </button>

              <button className={"tools-bar right-button next-button"} onClick={this.props.nextStep}>{"NEXT »"}</button>
              <button className={"tools-bar right-button previous-button"} onClick={this.props.prevStep}>{"« PREVIOUS"}</button>

          </div>
          <div id={"graph-overlay"}>
              <div id="overlay-info">Building Graph
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
              </div>
          </div>
        <div className={"causal-graph-container"}>

            <div className={"grid-item"} id={"graph"} style={{textAlign: "center"}}/>
            <div className={"grid-item"}>
                <div className={"legend legend-left cg-legend"}>
                    {legend.map((item) =>
                        <div style={{width: "150px"}}>
                            <div className={"series-marker"} style={{background: item.color}}></div>
                            <p>{item.value}</p>
                            <div className={"tools-bar-help legend-help"}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                <span className={"tools-bar-help-text legend-helptext"}>
                                    {item.helptext}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    )
  }
}
/*<object id="causalGraph" data={this.props.data} type="image/svg+xml" height={600} width={600}>
  {"Your browser doesn't support SVG"}
</object>

disabled={!this.state.isEdgeSelected || !this.state.isNodeSelected}>*/
