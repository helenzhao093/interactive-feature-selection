function HelpTooltip(props) {
    return(
        <div className={props.divClassName}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            <span className={props.tooltipClassName}>
                      {props.helptext}
                      </span>
        </div>
    )
}

class CausalGraph extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      graphviz: null,
      addEdge: false,
      removeEdge: false,
      reverseEdge: false,
      removeNode: false,
      selectInteraction: ["Highlight Selected", "Edit Graph"],
      selectedInteraction: "Highlight Selected",
      selectOptions: ["Markov Blanket", "Path to/from Target"],
      editOptions: ["Add Relation", "Remove Relation", "Reverse Relation", "Remove Feature"],
      markovBlanketSelected: true,
      selectedNode: "",
      selectedEdge: "",
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
    this.nodeRemoval = this.nodeRemoval.bind(this);
    this.nodeClicked = this.nodeClicked.bind(this);
    this.edgeClicked = this.edgeClicked.bind(this);
    this.removeNodeClass = this.removeNodeClass.bind(this);
    this.removeEdgeClass = this.removeEdgeClass.bind(this);
    this.removedEdgeFromGraph = this.removedEdgeFromGraph.bind(this);
    this.reverseEdgeFromGraph = this.reverseEdgeFromGraph.bind(this);
    this.addRemovedEdgeToGraph = this.addRemovedEdgeToGraph.bind(this);
    this.sendEdgeRemoved = this.sendEdgeRemoved.bind(this);
    this.addClassToElements = this.addClassToElements.bind(this);
    this.undo = this.undo.bind(this);
    this.changeDisplay = this.changeDisplay.bind(this);
    this.changeInteraction = this.changeInteraction.bind(this);
    this.setEditStatus = this.setEditStatus.bind(this);
    this.changeEdit = this.changeEdit.bind(this);
    this.highlightMB = this.highlightMB.bind(this);
    this.highlightPath = this.highlightPath.bind(this);
    this.highlightSelected = this.highlightSelected.bind(this);
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

          svg.attr("width", 1000).attr("height", 500);
      }
  }

  componentDidMount() {
    this.state.graphviz = d3.select("#graph").graphviz().zoom(false);
    this.renderGraph()
  }


  shouldComponentUpdate(nextProps, nextState) {
      return !(nextProps.dotSrc == this.props.dotSrc) || !(nextState.markovBlanketSelected == this.state.markovBlanketSelected) || (nextState.addEdge != this.state.addEdge) || (nextState.selectedInteraction != this.state.selectedInteraction);
  }

  componentDidUpdate() {
      var element = document.getElementById('graph-overlay');
      element.style.visibility = "hidden";
      this.renderGraph();

      if (this.state.selectedNode != "") {
          let nodeInfo = this.props.graph[this.state.selectedNode];
          this.highlightSelected(nodeInfo);
          if (this.state.markovBlanketSelected) {
              this.highlightMB(nodeInfo);
          } else {
              this.highlightPath(nodeInfo);
          }
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
    this.props.client.recordEvent('graph_history', {
        user: userID,
        datasetName: this.props.datasetName,
        type: "remove_edge",
        info: [nodeFrom, nodeTo],
        graph: graph
    });
    this.props.sendData("/removeEdge", { nodeFrom: nodeFrom, nodeTo: nodeTo });
  }

  reverseEdgeFromGraph(nodeFrom, nodeTo) {
    this.props.client.recordEvent('graph_history', {
        user: userID,
        datasetName: this.props.datasetName,
        type: "reverse_edge",
        info: [nodeFrom, nodeTo],
        graph: graph
    });
    this.props.sendData("/reverseEdge", { nodeFrom: nodeFrom, nodeTo: nodeTo });
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
  }

  edgeClicked(element) {
    this.state.selectedNode = "";
    this.removeEdgeClass();
    this.removeNodeClass();

    var nodes = element.key.split("->");
    const nodeInfo = this.props.graph[nodes[0]];
    const nodeFromIndex = nodeInfo.nodeIndex;
    const nodeToIndex = this.props.graph[nodes[1]].nodeIndex;
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

    this.props.client.recordEvent('causal_graph_clicks', {
        user: userID,
        datasetName: this.state.datasetName,
        type: "edge",
        info: [nodeFrom, nodeTo]
    });

    if (this.state.removeEdge) {
      let selectedEdgeFromTo = [nodeFrom, nodeTo];
      this.state.selectedEdge = "";
      this.state.removedEdges.push(selectedEdgeFromTo);
      this.state.edits.push({ "type": "removeEdge", "data": selectedEdgeFromTo });
      this.removedEdgeFromGraph(nodeFrom, nodeTo);
    } else if (this.state.reverseEdge) {
      let selectedEdgeFromTo = [nodeFrom, nodeTo];
      this.state.selectedEdge = "";
      this.state.edits.push({ "type": "reverseEdge", "data": selectedEdgeFromTo });
      this.reverseEdgeFromGraph(nodeFrom, nodeTo);
    } else {
      d3.select('#node' + nodeFromIndex.toString()).raise().classed("selected-edgenode", true)
      d3.select('#node' + nodeToIndex.toString()).raise().classed("selected-edgenode", true)
      d3.select('#edge' + (edge).toString()).raise().classed("selected-edge", true)
      this.state.selectedEdge = '#edge' + (edge);
    }


  }

  addClassToElements(elements, idPreFix, newClass) {
      elements.map((element) => {
          const elementId = idPreFix + element;
          d3.select(elementId).raise().classed(newClass, true);
      })
  }

  nodeRemoval(nodeName) {
      console.log(nodeName)
      var element = document.getElementById('graph-overlay');
      element.style.visibility = "visible";
      this.state.edits.push({ "type": "removeNode", "data": this.state.selectedNode });
      this.state.selectedNode = "";
      console.log(this.state.removedEdges);
      this.props.sendData("/redrawGraph", {features: [nodeName], removedEdges: this.state.removedEdges });
  }

  nodeClicked(element) {
      this.state.selectedEdge = "";
      this.removeEdgeClass();
      this.removeNodeClass();
      if (this.state.removeNode) {
          this.nodeRemoval(element.key);
          return;
      }
      const nodeInfo = this.props.graph[element.key];

      this.highlightSelected(nodeInfo);

      if (this.state.addEdge) {
          if (this.state.selectedNode == element.key) { // remove selection if clicked on same node
            this.state.selectedNode = "";
            d3.selectAll('.node').classed("selected-node", false);

          } else if (this.state.selectedNode != "") { // first element was selected
              const firstNode = this.state.selectedNode;
              const secondNode = element.key;
              this.state.selectedNode = "";
              this.state.selectedEdge = "";
              this.state.edits.push({ "type": "addEdge", "data": [firstNode, secondNode] });
              this.props.sendData("/addEdge", {"nodeFrom": firstNode, "nodeTo": secondNode });
              d3.selectAll('.node').classed("selected-node", false); // remove highlight
          } else {
              this.state.selectedNode = element.key;
          }
      }
      else if (this.state.markovBlanketSelected) {
          this.highlightMB(nodeInfo);

          this.props.client.recordEvent('causal_graph_clicks', {
              user: userID,
              datasetName: this.state.datasetName,
              info: element.key,
              type: "node",
              markovBlanket: this.state.markovBlanketSelected
          });

          this.state.selectedNode = element.key;
      } else {
          this.highlightPath(nodeInfo);
          this.props.client.recordEvent('causal_graph_clicks', {
              user: userID,
              datasetName: this.state.datasetName,
              info: element.key,
              type: "node",
              markovBlanket: this.state.markovBlanketSelected
          });
          this.state.selectedNode = element.key;
      }
  }

  highlightSelected(nodeInfo) {
      const selectedNodeId = '#node' + nodeInfo.nodeIndex;
      d3.select(selectedNodeId).raise().classed("selected-node", true);
  }

  highlightMB(nodeInfo) {
      Object.keys(nodeInfo.edgeTo).map((toNode) => {
          const elementId = '#edge' + (nodeInfo.edgeTo[toNode]).toString()
          d3.select(elementId).raise().classed("selected-edgeto", true);
      });
      this.addClassToElements(nodeInfo.edgeFrom, '#edge', "selected-edgefrom");
      this.addClassToElements(nodeInfo.nodeFrom, '#node', "selected-nodefrom");
      this.addClassToElements(nodeInfo.nodeTo, '#node', "selected-nodeto");
      this.addClassToElements(nodeInfo.spouseNode, '#node', "selected-spousenode");
      this.addClassToElements(nodeInfo.spouseEdge, '#edge', "selected-spouseedge");
  }

  highlightPath(nodeInfo) {
      this.addClassToElements(nodeInfo.paths, '#edge', "selected-edgeto");
      this.addClassToElements(nodeInfo.pathNodes, '#node', "selected-nodeto");
      this.addClassToElements(nodeInfo.pathsFrom, '#edge', "selected-edgefrom");
      this.addClassToElements(nodeInfo.pathNodesFrom, '#node', "selected-nodefrom");
  }

  undo() {
      console.log(this.state.removedEdges);
      var lastEdit = this.state.edits.pop();
      console.log(lastEdit)
      if (lastEdit.type == 'removeEdge') {
          this.state.removedEdges.splice(this.state.removedEdges.indexOf(lastEdit.data), 1)
      }
      this.props.undo(lastEdit);
  }

  clear() {
      this.state.selectedNode = "";
      this.state.selectedEdge = "";
      this.state.removedEdges = [];
      this.state.selectedInteraction = this.state.selectInteraction[0];
      this.state.markovBlanketSelected = true;
      this.state.edits = {};
      this.props.clearGraph()
  }

  changeInteraction(event) {

      let interaction = event.target.value;
      if (interaction == this.state.selectInteraction[0] && this.state.selectedInteraction != this.state.selectInteraction[0]) { // select Highlight Selected
          this.setState({
              selectedInteraction: this.state.selectInteraction[0],
              markovBlanketSelected: true,
              removeEdge: false,
              removeNode: false,
              addEdge: false,
              selectedNode: "",
              selectedEdge: ""
          });
      }
      if (interaction == this.state.selectInteraction[1] && this.state.selectedInteraction != this.state.selectInteraction[1]) { // select Edit Graph
          this.setState({
              selectedInteraction: this.state.selectInteraction[1],
              removeEdge: false,
              removeNode: false,
              addEdge: true,
              selectedNode: "",
              selectedEdge: ""
          });
      }
  }

  changeDisplay(event) {
    console.log( event.target.value );
    let display = event.target.value;
    if (display == this.state.selectOptions[0] && this.state.markovBlanketSelected == false) {
        this.setState({
            markovBlanketSelected: true,
        })
    }
    if (display == this.state.selectOptions[1] && this.state.markovBlanketSelected == true) {
        this.setState({
            markovBlanketSelected: false,
        });
    }
  }

  setEditStatus(addEdge, removeEdge, reverseEdge, removeNode) {
      this.state.addEdge = addEdge;
      this.state.removeEdge = removeEdge;
      this.state.removeNode = removeNode;
      this.state.reverseEdge = reverseEdge;
      this.state.selectedNode = "";
      this.state.selectedEdge = "";
  }

  changeEdit(event) {
    console.log( event.target.value );
      let editName = event.target.value;
      if (editName == this.state.editOptions[0]) {
        this.setEditStatus(true, false, false, false);
      } else if (editName == this.state.editOptions[1]) {
        this.setEditStatus(false, true, false, false);
      } else if (editName == this.state.editOptions[2]) { //reverse edge
        this.setEditStatus(false, false, true, false);
      } else if (editName == this.state.editOptions[3]) { // remove node
        this.setEditStatus(false, false, false, true);
      } else {
        //this.setEditStatus(false, false, true);
      }
  }


  render(){
    console.log(this.props);
    var colorMB = this.state.markovBlanketSelected ? "yellowgreen" : "darkgray";
    var legend = (this.state.markovBlanketSelected) ? this.state.legendMB : this.state.legendPath;
    var secondSelect =  (this.state.selectedInteraction == this.state.selectInteraction[0]) ? this.state.selectOptions : this.state.editOptions;
    let defaultSelect = (this.state.selectedInteraction == this.state.selectInteraction[0]) ? this.state.selectOptions[0] : this.state.editOptions[0];
    var secondSelectOnChange = (this.state.selectedInteraction == this.state.selectInteraction[0]) ? this.changeDisplay : this.changeEdit;
    return (
      <div width={700} height={500}>
          <div className={"tools-bar"}>
              <span className={"causal-graph-toolbar-span"}>Graph Interactions: </span>
              <div className={"causal-graph-select-div"}>
                  <select className={"causal-graph-select"} onChange={ this.changeInteraction }>
                      {this.state.selectInteraction.map((select) =>
                          <option value={select}>{select}</option>
                      )}
                  </select>
              </div>
              <div className={"causal-graph-select-div"}>
                  <select className={"causal-graph-select"} onChange={ secondSelectOnChange }>
                      {secondSelect.map((edit) =>
                          <option selected={(edit == defaultSelect) ? "selected" : ""} value={edit}>{edit}</option>
                      )}
                  </select>
              </div>
              <HelpTooltip divClassName={"tools-bar-help"} tooltipClassName={"tools-bar-help-text"} helptext={""}/>

              <button className={"tools-bar action-button"} onClick={ this.undo }>{"Undo"}</button>
                <button className={"tools-bar action-button"} onClick={() => this.clear()}>{"Reset"}</button>

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
            <VerticalLegend style={{position: "absolute", marginLeft : "20", marginTop: "500"}} legend={legend} width={150}/>

        </div>
      </div>
    )
  }
}


/*<object id="causalGraph" data={this.props.data} type="image/svg+xml" height={600} width={600}>
  {"Your browser doesn't support SVG"}
</object>

disabled={!this.state.isEdgeSelected || !this.state.isNodeSelected}>

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
<button className={"tools-bar action-button"} onClick={() => this.updateGraphSelection(this.state.markovBlanket)} style={{ background:  colorMB}}>
              {this.state.markovBlanket}
              </button>
              <div className={"tools-bar-help"}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <span className={"tools-bar-help-text"}>
                      {"Highlights the set of nodes (markov blanket) that cuts the selected node from the rest of the graph."}
                  </span>
              </div><button className={"tools-bar action-button"} onClick={() => this.updateGraphSelection(this.state.pathToFromTarget)} style={{ background: this.state.markovBlanketSelected ? "darkgray" : "yellowgreen" }}>
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
              */
