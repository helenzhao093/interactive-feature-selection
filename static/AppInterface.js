class AppInterface extends React.Component {
  constructor(props) {
    super(props);
    console.log(props)
    var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ];
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames);
    var featureCoordinatesSize = [1000,500];
    var xScaleRange = props.features.features.map((feature, index) =>
      featureCoordinatesSize[0]/(props.features.features.length - 1) * index
    );
    var xScaleDomain = props.features.features.map((feature, index) =>
      feature.name
    );
    var xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange);
    this.state = {
        activeTabIndex: 0,
        causalGraph: {
            showComponent: true,
            markovBlanketSelected: this.props.markovBlanketSelected,
            isEdgeSelected: this.props.isEdgeSelected,
            isNodeSelected: this.props.isNodeSelected,
            graphHistory: [{ graph: this.props.graph, dotSrc: this.props.dotSrc }],
        },
        graphIndex: 0,
        featureImportance: {
            showComponent: false,
            features: {}, // initialized to null object
        },
        featureSelection: {
            showComponent: false,
            xScaleDomain: null,
            xScale: null,
            features: {}
        },
        analysis: {
            showComponent: false
        },
        consistencyScores:{
            MB: [],
            MI: []
        },
        currentScores: {
            MB: -1, //parseFloat(this.props.consistencyMB.toFixed(3)),
            MI: -1 //parseFloat(this.props.MI.toFixed(3))
        },
        metrics: {
            accuracy: [],
            precision: []
        },
        consistencyGraphLegend: {
            keys: ["MB consistency", "Mutual Information"],
            colors: ["red", "green"]
        },
        metricsGraphLegend: {
            keys: ["accuracy", "precision"],
            colors: ["orange", "blue"]
        },
        rankLoss: {
            score:[]
        },
        rankLossCurrent: {
            score: -1
        },
        rankLossGraphLegend: {
            keys: ["rank loss"],
            colors: ['blue']
        },
        featureData: {
            inputData: this.props.features.inputData,
            classDisplay: this.props.features.classDisplay
        },
        selectedFeatureNames: [],
        featureRank: {},
        rankData: [],
        numRanks: 2,
        featureHistory: [],
        step: 0,
        dragging: {},
        colorFunction: color,
        featureCoordinatesSize: featureCoordinatesSize,
        markovBlanketFeatureNames: [],
        xAxisLength: 2,
        selectedIndex: 0
    };
    //console.log(this.state)
    this.sendData = this.sendData.bind(this);
    this.removeLastGraph = this.removeLastGraph.bind(this);
    this.clearGraph = this.clearGraph.bind(this);
    this.sendGraphToFeatureImportance = this.sendGraphToFeatureImportance.bind(this);
    this.getNodeIndexToFeatureMap = this.getNodeIndexToFeatureMap.bind(this);
    this.getMarkovBlanketFeatureNames = this.getMarkovBlanketFeatureNames.bind(this);
    this.updateFeatureRank = this.updateFeatureRank.bind(this);
    this.updateData = this.updateData.bind(this);
    this.position = this.position.bind(this);
    this.featureAxisOnEnd = this.featureAxisOnEnd.bind(this);
    this.sendImportanceToSelection = this.sendImportanceToSelection.bind(this);
    this.classify = this.classify.bind(this);
    this.updateIndex = this.updateIndex.bind(this);
    this.goToStep = this.goToStep.bind(this);
    this.getInitialConsistencyScores = this.getInitialConsistencyScores.bind(this);
    this.getInitialFeatureRank = this.getInitialFeatureRank.bind(this);
    this.initializeRankData = this.initializeRankData.bind(this);
    this.updateNumRanks = this.updateNumRanks.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
      /*props.featureData.features.sort(function(a, b) { return a.index - b.index });
      props.featureData.features.splice(props.markovBlanket.length, 0,
        { index: props.featureData.features.length,
          display: true,
          name: "BOUNDARY",
          type: "continuous",
          range: [0,0]
        }
      );

      var features = {}
      props.featureSchema.sort(function (a,b) { return a.index - b.index })
      props.featureSchema.map(feature => {
          feature.rank = 0;
          features[feature.index] = feature;
      })
      console.log(features)

      this.props.featureSchema.map((feature) =>
          feature.rank = 0
      )

      this.state = {
        dotSrc: this.props.dotSrc,
        markovBlanketSelected: this.props.markovBlanketSelected,
        isEdgeSelected: this.props.isEdgeSelected,
        isNodeSelected: this.props.isNodeSelected,
        featureData:this.props.featureData,
        features: this.props.featureData.features,
        xScaleDomain: xScaleDomain,
        xScale: xScale,
        featureCoordinatesSize: featureCoordinatesSize,
        featureSchema:features,
        dragging: {},
        colorRange: colorRange,
        colorFunction: color,
        selectedIndex: 0,
        progressGraphKeys: ["Ranking consistency", "MB consistency", "Mutual Information"],
        progressGraphKeyColor: ["red", "green", "blue"],
        xAxisLength: 2,
        consistencyScores: { EK: [],
                             MB: [],
                             MI: []
                             } ,//[0.99, this.props.consistencyEK]
        currentScores: { EK: 0.22,
                         MB: parseFloat(this.props.consistencyMB.toFixed(3)),
                         MI: parseFloat(this.props.MI.toFixed(3)) },
        metrics: { accuracy: [],
                   precision: [] },
        featureHistory: [],
        step: 0,
        histogramHistory: [],
        histogramUpdateStep: -1,
        currentHistogramHistory: [],
        currentHistogramStep: -1,
        histogramSize: [300,300],
        margin: {top: 5, right: 5, bottom: 15, left: 0},
      };
      this.sendData = this.sendData.bind(this);
      this.handleClassSelection = this.handleClassSelection.bind(this);

      this.position = this.position.bind(this);
      this.featureAxisOnEnd = this.featureAxisOnEnd.bind(this);

      this.histogramSettingSelection = this.histogramSettingSelection.bind(this)
       */

  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  handleTabClick(tabIndex) {
      this.setState({
          activeTabIndex: tabIndex === this.state.activeTabIndex ? this.props.defaultActiveTabIndex : tabIndex
      });
    }

  sendData(url, dataToSend) {
    //console.log(dataToSend);
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }).then(function(response) {
      return response.json();
    }).then(data => {
        const currentGraphHistory = this.state.causalGraph.graphHistory.splice(0, this.state.graphIndex + 1);
        this.setState({
            causalGraph: {
                showComponent: true,
                markovBlanketSelected: data.markovBlanketSelected,
                isEdgeSelected: data.isEdgeSelected,
                isNodeSelected: data.isNodeSelected,
                graphHistory: currentGraphHistory.concat([ { graph: data.graph, dotSrc: data.dotSrc } ]),
            },
            graphIndex: currentGraphHistory.length
        })
    }).catch(function(error) {
      console.log(error)
    })
  }

  removeLastGraph(node) {
      const currentIndex = this.state.graphIndex;
      fetch('/addRemovedNode', {
          method: 'POST',
          body: JSON.stringify({ node: node })
      }).then(function(response) {
          return response.json();
      });
      this.setState({
          graphIndex: currentIndex - 1
      });
  }

  clearGraph() {
      fetch('/clearGraph', {
          method: 'POST',
      }).then(function(response) {
          return response.json();
      });
      this.setState({
          graphIndex: 0
      });
  }

  getNodeIndexToFeatureMap(graph){
    var indexToFeatureMap = {};
    Object.keys(graph).map((featureName) =>
      indexToFeatureMap[graph[featureName].nodeIndex] = featureName
    );
    return indexToFeatureMap;
  }

  getMarkovBlanketFeatureNames(indexToFeatureMap, classNode) {
    const nodeList = [classNode.spouseNode, classNode.nodeTo, classNode.nodeFrom]
    var markovBlanketFeatureNames = new Set();
    nodeList.map((nodes) => {
      nodes.map((nodeIndex) => {
        markovBlanketFeatureNames.add(indexToFeatureMap[nodeIndex])
      })
    });
    return markovBlanketFeatureNames;
  }

  getInitialFeatureRank(markovBlanketFeatureNames) {
      var rankedFeatures = {};
      this.props.features.features.sort(function (a,b) { return a.index - b.index });
      this.props.features.features.map(feature => {
          rankedFeatures[feature.index] = feature;
          if (markovBlanketFeatureNames.has(feature.name)) {
              rankedFeatures[feature.index].rank = 0;
              rankedFeatures[feature.index].circleIndex = 1;
          } else {
              rankedFeatures[feature.index].rank = 1;
              rankedFeatures[feature.index].circleIndex = 0;
          }
      });
      return rankedFeatures;
  }

  sendGraphToFeatureImportance() {
    const currentIndex = this.state.graphIndex;
    const currentGraph = this.state.causalGraph.graphHistory[currentIndex].graph;
    var indexToFeatureMap = this.getNodeIndexToFeatureMap(currentGraph);
    var markovBlanketFeatureNames = this.getMarkovBlanketFeatureNames(indexToFeatureMap, currentGraph.CLASS);
    this.state.markovBlanketFeatureNames = markovBlanketFeatureNames;
    const rankedFeatures = this.getInitialFeatureRank(markovBlanketFeatureNames);

    this.setState({
      featureImportance: {
        showComponent: true,
        features: rankedFeatures,
        markovBlanket: markovBlanketFeatureNames
      },
        activeTabIndex : 1
    })
  }

  updateData(data) {
    console.log(data);
    var keys = Object.keys(data);
    //console.log(this.state.consistencyMB)
    //console.log(data.consistencyMB.toFixed(3))
    if (keys.includes("featureData")) {
      this.setState({
        featureData: data.featureData
      })
    } else if(keys.includes("histogramData")) {
        const currentHistogramHistory = this.state.currentHistogramHistory.splice(0, this.state.currentHistogramStep + 1)
        this.setState({
            currentHistogramHistory: currentHistogramHistory.concat([{data: data.histogramData }]),
            currentHistogramStep: currentHistogramHistory.length
        })

    } else {
      var axisLength = this.state.xAxisLength;
      if (this.state.consistencyScores.MB.length >= 2 && this.state.currentScores.MB == -1) {
        axisLength = axisLength + 1
      }
      console.log(axisLength);
      this.setState({
        currentScores: {
          MB: parseFloat(data.consistencyMB.toFixed(3)),
          MI: parseFloat(data.MI.toFixed(3)),
          EK: 0.5
        },
        xAxisLength: axisLength,
      })
    }
  }

  classify() {
    if (this.state.currentScores.MI >= 0) {

      // names of features in feature set
      const allFeatureNames = this.state.featureSelection.features.map((feature) =>
        feature.name
      );
      const stopIndex = allFeatureNames.indexOf("BOUNDARY");
      allFeatureNames.splice(stopIndex);

      // feature set ranking
      var featureRank = {};
      Object.keys(this.state.featureImportance.features).map(key =>
        featureRank[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].rank
      );

      const features = { "features": allFeatureNames , "featureRank" : featureRank};
      console.log(features)
      fetch('/classify', {
        method: 'POST',
        body: JSON.stringify(features)
      }).then(function(response) {
        return response.json();
      }).then(data => {
        console.log(data);
        //const currentHistogramHistory = this.state.histogramHistory.splice(0, this.state.histogramUpdateStep + 1)
        //var currentFeatureHistory = this.state.featureData.features.slice();
        //this.state.featureHistory.push(currentFeatureHistory);
        //console.log(this.state.featureHistory);
        var keys = Object.keys(this.state.consistencyScores);
        keys.forEach((key) =>
          this.state.consistencyScores[key].push(this.state.currentScores[key])
        );
        this.state.rankLoss.score.push(this.state.rankLossCurrent.score);
        console.log(this.state.consistencyScores);
        this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)));
        this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)));
        this.setState({
          consistencyScores: this.state.consistencyScores,
          currentScores: {
            MI: -1,
            MB: -1,
            EK: -1
          },
          metrics: {
            precision: this.state.metrics.precision,
            accuracy: this.state.metrics.accuracy
          },
          rankLoss: this.state.rankLoss,
          rankLossCurrent: {
              score: -1,
          }
          //featureHistory: this.state.featureHistory,
          //histogramHistory: currentHistogramHistory.concat([ {data: data.histogramData }]),
          //histogramUpdateStep: currentHistogramHistory.length,
          //currentHistogramHistory: [ { data: data.histogramData }],
          //currentHistogramStep: 0
        })
      }).catch(function(error) {
        console.log(error)
      })
    }
  }

  updateIndex(index) {
    this.setState({
      selectedIndex: index
    })
  }

  position(d) {
    var value = this.state.dragging[d];
    var a = value == null ? this.state.featureSelection.xScale(d) : value;
    //console.log(a)
    return value == null ? this.state.featureSelection.xScale(d) : value;
  }

  calculateScores(dataToSend) {
      fetch("/calculateScores", {
          method: 'POST',
          body: JSON.stringify(dataToSend)
      }).then(function(response) {
          return response.json();
      }).then(data => {
          console.log(data);
          var axisLength = this.state.xAxisLength;
          var selectedIndex = this.state.selectedIndex;
          if (this.state.consistencyScores.MB.length >= 2 && this.state.currentScores.MB == -1) {
              axisLength = axisLength + 1;
              selectedIndex = selectedIndex + 1;
          }
          console.log(axisLength);
          this.setState({
              currentScores: {
                  MB: parseFloat(data.consistencyMB.toFixed(3)),
                  MI: parseFloat(data.MI.toFixed(3)),
              },
              rankLossCurrent: {
                  score: parseFloat(data.rankLoss.toFixed(3))
              },
              xAxisLength: axisLength,
              selectedIndex: selectedIndex
          });
      }).catch(function(error) {
          console.log(error)
      });
  }


  featureAxisOnEnd(element) {
    var that = this;
    var attrId = element.id;
    var stringId = '#' + attrId;
    d3.selectAll('.feature-parallels').select(stringId).attr('transform', function(d) { return 'translate(' + that.state.featureSelection.xScale(attrId) + ")" });
    this.state.dragging[attrId] = d3.event.x;
    var oldFeatureNames = this.state.featureSelection.features.map((feature) =>
      feature.name
    );
    var features = this.state.featureSelection.features;
    features.sort(function(a, b) { return that.position(a.name) - that.position(b.name)});
    var allFeatureIndexes = features.map((feature) =>
      feature.index
    );
    var allFeatureNames = features.map((feature) =>
      feature.name
    );
    delete this.state.dragging[attrId];
    if (JSON.stringify(oldFeatureNames) != JSON.stringify(allFeatureNames)) {
      d3.selectAll('.feature-node').classed("ek-selected", false);
      const stopIndex = allFeatureIndexes.indexOf(features.length - 1);
      allFeatureIndexes.splice(stopIndex);
      allFeatureNames.splice(stopIndex);
      var xScaleDomain = features.map((feature, index) =>
        feature.name
      );

      var EK = d3.select('#expert-knowledge');
      allFeatureIndexes.map(index => {
        var stringId = '#' + index;
        EK.select(stringId).raise().classed("ek-selected", true)
      });

      var xScale = this.state.featureSelection.xScale.domain(xScaleDomain);

      /* feature rank
      var featureRank = {};
      Object.keys(this.state.featureImportance.features).map(key =>
          featureRank[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].rank
      ); */

      this.calculateScores({ features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: this.state.featureRank });
      this.setState({
          featureSelection: {
              xScale: xScale,
              xScaleDomain: xScaleDomain,
              features: features
          },
          selectedFeatureNames: allFeatureNames
      });
    }
  }

  goToStep(step) {
    //var featureHistory = this.state.featureHistory
    //this.state.featureHistory.splice(step + 1)
    //console.log(step)
    //var currentHistogramHistory = this.state.histogramHistory[step]
    //console.log(currentHistogramHistory)
    //console.log(this.state.featureHistory);
    var previousFeatures = this.state.featureHistory[step];
    //console.log(features)
    var xScaleDomain = previousFeatures.map((feature) =>
      feature.name
    );
    var xScale = this.state.xScale.domain(xScaleDomain);
    this.setState({
        featureSelection: {
            features: previousFeatures,
            xScale: xScale,
            xScaleDomain: xScaleDomain
        }
        //currentHistogramHistory: [{data: currentHistogramHistory.data }],
        //currentHistogramStep: 0
    });
  }

  handleClassSelection(className, currentDisplay){
    console.log(className, currentDisplay);
    fetch("/classSelected", {
        method: 'POST',
        body: JSON.stringify({"className": className, "currentDisplay": currentDisplay })
    }).then(function(response) {
        return response.json();
    }).then(data => {
        console.log(data);
        this.setState({
            featureData: data.featureData
        })
    }).catch(function(error) {
        console.log(error)
    });
  }

  /*
    histogramSettingSelection(classification, display) {
      console.log('clicked settings')
        this.sendData('/postHistogramDisplay',
          { "classification": classification,
            "display": display}
        )
  } */

  updateFeatureRank(featureId, rank) {
    console.log(featureId, rank);
    this.state.featureImportance.features[featureId].rank = rank;
  }

  getInitialConsistencyScores(features) {
      var allFeatureIndexes = features.map((feature) =>
          feature.index
      );
      var allFeatureNames = features.map((feature) =>
          feature.name
      );
      const stopIndex = allFeatureIndexes.indexOf(features.length - 1);
      allFeatureIndexes.splice(stopIndex);
      allFeatureNames.splice(stopIndex);

      this.calculateScores({ features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: this.state.featureRank });
      return allFeatureNames;
  }

  updateNumRanks(numRanks) {
      this.state.numRanks = numRanks;
  }

  initializeRankData() { //mapping of name to rank
      var featureRankMap = {};
      Object.keys(this.state.featureImportance.features).map(key =>
          featureRankMap[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].circleIndex + 1
      );
      var featureNames = Object.keys(featureRankMap);
      var rankData = {};
      for (var i = 0; i <= this.state.numRanks; i++) {
          rankData[i] = {};
          rankData[i].MB = [];
          rankData[i].NotMB = [];
      }

      featureNames.map((name) => {
          console.log(featureRankMap[name]);
          if (this.state.markovBlanketFeatureNames.has(name)) {
              rankData[featureRankMap[name]].MB.push(name);
          } else {
              rankData[featureRankMap[name]].NotMB.push(name);
          }
      });
      var rankDataArray = [];
      Object.keys(rankData).map((key) => {
          rankData[key].rank = key
          rankDataArray.push(rankData[key])
      });
      this.state.rankData = rankDataArray;
  }

  sendImportanceToSelection() {
      var featureRank = {};
      Object.keys(this.state.featureImportance.features).map(key =>
          featureRank[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].rank
      );
      this.state.featureRank = featureRank;

      this.initializeRankData();

    var featuresWithBoundary = [];
    Object.keys(this.state.featureImportance.features).map((featureKey) => {
      if (this.state.markovBlanketFeatureNames.has(this.state.featureImportance.features[featureKey].name)) {
        featuresWithBoundary.unshift(this.state.featureImportance.features[featureKey]);
      } else {
        featuresWithBoundary.push(this.state.featureImportance.features[featureKey]);
      }
      //featuresWithBoundary[featureKey] = this.state.featureImportance.features[featureKey]
    });
    featuresWithBoundary.splice(this.state.markovBlanketFeatureNames.size, 0,
      { index: featuresWithBoundary.length,
        display: true,
        name: "BOUNDARY",
        type: "continuous",
        range: [0,0]
      }
    );
    console.log(featuresWithBoundary)
    var xScaleRange = featuresWithBoundary.map((feature, index) =>
      this.state.featureCoordinatesSize[0]/(featuresWithBoundary.length - 1) * index
    );
    var xScaleDomain = featuresWithBoundary.map((feature, index) =>
      feature.name
    );
    var xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange);

    var allFeatureNames = this.getInitialConsistencyScores(featuresWithBoundary);

    this.setState({
      featureSelection: {
        xScaleDomain: xScaleDomain,
        xScale: xScale,
        features: featuresWithBoundary
      },
      selectedFeatureNames: allFeatureNames,
        activeTabIndex: 2
    });
  }

  render() {
      console.log('app');
      /*let metricsGraph;
      let metricsLegend;
      if (this.state.metrics.precision.length > 0) {
          metricsGraph = <ProgressGraph size={[500, 300]}
                                        name={"metrics"}
                                        consistencyScores={this.state.metrics}
                                        colors={this.state.metricsGraphLegend.colors}
                                        selectedIndex={this.state.selectedIndex}
                                        updateIndex={this.updateIndex}
                                        xAxisLength={this.state.xAxisLength}
                                        goToStep={(s) => this.goToStep(s)}
          />;
          metricsLegend = <Legend keys={Object.keys(this.state.metrics)} colors={["orange", "blue"]}/>

      } else {
          metricsGraph = <div></div>;
          metricsLegend = <div></div>;
      } */
    /*
      const currentHistogramData = (this.state.currentHistogramStep >= 0) ?
          this.state.currentHistogramHistory[this.state.currentHistogramStep] :
          {};

      let histograms;
      let settings;
      if (this.state.currentHistogramStep > -1) {
          histograms = currentHistogramData.data.HistogramData.map((data, index) =>
              <Histogram data={data} max={currentHistogramData.data.range[0]} min={currentHistogramData.data.range[1]}
                         size={this.state.histogramSize} margin={this.state.margin}
                         maxNeg={currentHistogramData.data.maxNeg} maxPos={currentHistogramData.data.maxPos}
                         index={index}
                         colorRange={this.state.colorRange}
                         colorFunction={this.state.colorFunction}
                         index={index}
              />)
          settings = <Settings display={currentHistogramData.data.display}
                               onClick={(c, d) => this.histogramSettingSelection(c, d)}/>
      }
      else {
          histograms = <div></div>
          settings = <div></div>
      } */

    var rankLossMax = this.state.rankLossCurrent.score;
    rankLossMax = Math.max(rankLossMax, Math.max.apply(null, this.state.rankLoss.score)) + 1;
    //var rankLossMin = this.state.rankLossCurrent.score;
     // rankLossMin = Math.min(rankLossMin, Math.min.apply(null, this.state.rankLoss.score));
      const currentGraphHistory = this.state.causalGraph.graphHistory[this.state.graphIndex];
      return (
          <Tabs activeTabIndex={this.state.activeTabIndex} handleTabClick={(t) => this.handleTabClick(t)}>
              <Tab linkClassName={"CausalGraph"}>
                  <CausalGraph
                      dotSrc={currentGraphHistory.dotSrc}
                      sendData={this.sendData}
                      graph={currentGraphHistory.graph}
                      markovBlanketSelected={this.state.causalGraph.markovBlanketSelected}
                      isEdgeSelected={this.state.causalGraph.isEdgeSelected}
                      isNodeSelected={this.state.causalGraph.isNodeSelected}
                      undoNodeRemoval={(n) => this.removeLastGraph(n)}
                      clearGraph={this.clearGraph}
                  />
                  <button onClick={this.sendGraphToFeatureImportance}>{"Next"}</button>
              </Tab>
              <Tab linkClassName={"Feature Importance"}>
                <ExpertKnowledge
                    display={this.state.featureImportance.display}
                    features={this.state.featureImportance.features}
                    updateFeatureRank={(r, f) => this.updateFeatureRank(r, f)}
                    updateNumRanks={(r) => this.updateNumRanks(r)}
                    width={500}
                    height={500}
                />
                <button onClick={this.sendImportanceToSelection}>{"Next"}</button>
              </Tab>
              <Tab linkClassName={"Feature Selection"}>
                  <div>
                      <div style={{width: "100%", height: 20}}>
                          <CheckboxMultiSelect options={this.state.featureData.classDisplay}
                                               handleChange={(c, d) => this.handleClassSelection(c, d)}/>
                          <button onClick={this.classify}>{"Classify"}</button>

                      </div>
                      <FeatureParallelCoordinates
                          data={this.state.featureData.inputData}
                          features={this.state.featureSelection.features}
                          xScaleDomain={this.state.featureSelection.xScaleDomain}
                          xScale={this.state.featureSelection.xScale}
                          dragging={this.state.dragging}
                          featureAxisOnEnd={this.featureAxisOnEnd}
                          size={this.state.featureCoordinatesSize}
                          sendData={this.sendData}
                          colorFunction={this.state.colorFunction}
                      />
                      <div className={"grid-container"}>
                      <div className={"grid-item"}>
                          <ProgressGraph size={[500, 300]}
                                         max={1}
                                         min={0}
                                         name={"consistency"}
                                         consistencyScores={this.state.consistencyScores}
                                         metrics={this.state.metrics}
                                         metricsColors={this.state.metricsGraphLegend.colors}
                                         currentScores={this.state.currentScores}
                                         colors={this.state.consistencyGraphLegend.colors}
                                         selectedIndex={this.state.selectedIndex}
                                         updateIndex={this.updateIndex}
                                         xAxisLength={this.state.xAxisLength}
                                         goToStep={(s) => this.goToStep(s)}
                          />
                          <Legend keys={this.state.consistencyGraphLegend.keys.concat(this.state.metricsGraphLegend.keys)}
                                  colors={this.state.consistencyGraphLegend.colors.concat(this.state.metricsGraphLegend.colors)}/>
                      </div>
                          <div className={"grid-item"}>
                          <PieChart size={[300,300]}
                                    data={Array.from(this.state.markovBlanketFeatureNames)}
                                    selection={this.state.selectedFeatureNames}
                          />
                          </div>
                          <div className={"grid-item"}>
                      <ProgressGraph size={[500, 300]}
                                     max={rankLossMax}
                                     min={0}
                                     name={"rankLoss"}
                                     consistencyScores={this.state.rankLoss}
                                     metrics={{accuracy: [], precision: []}}
                                     metricsColors={[]}
                                     currentScores={this.state.rankLossCurrent}
                                     colors={this.state.rankLossGraphLegend.colors}
                                     selectedIndex={this.state.selectedIndex}
                                     updateIndex={this.updateIndex}
                                     xAxisLength={this.state.xAxisLength}
                                     goToStep={(s) => this.goToStep(s)}
                      />
                      <Legend keys={this.state.rankLossGraphLegend.keys}
                              colors={this.state.rankLossGraphLegend.colors}/>
                          </div>
                          <div className={"grid-item"}>
                              <SunburstChart size={[300,300]}
                                data={this.state.rankData}
                                selection={this.state.selectedFeatureNames}
                                />
                          </div>
                      </div>
                  </div>
              </Tab>
          </Tabs>
      )
  }
}

/*
<ProgressGraph size={[500, 300]}
                                     name={"metrics"}
                                     consistencyScores={this.state.metrics}
                                     colors={this.state.metricsGraphLegend.colors}
                                     selectedIndex={this.state.selectedIndex}
                                     updateIndex={this.updateIndex}
                                     xAxisLength={this.state.xAxisLength}
                                     goToStep={(s) => this.goToStep(s)}
                      />

              <Tab linkClassName={"Importance"}>
                  <ExpertKnowledge
                      featureSchema={this.state.featureSchema}
                      updateFeatureRank={(r, f) => this.updateFeatureRank(r, f)}
                      width={500}
                      height={500}
                  />
              </Tab>
              <Tab linkClassName={"Selection"}>
                  <div>
                      <div style={{width: "100%", height: 20}}>
                          <CheckboxMultiSelect options={this.state.featureData.classDisplay}
                                               handleChange={(c, d) => this.handleClassSelection(c, d)}/>
                      </div>
                      <Legend keys={["N", "P", "S"]} colors={this.state.progressGraphKeyColor}/>
                      <div style={{width: "100%", height: 20}}>
                          <button onClick={this.classify}>{"Classify"}</button>
                      </div>
                      <FeatureParallelCoordinates
                          data={this.state.featureData.inputData}
                          features={this.state.features}
                          xScaleDomain={this.state.xScaleDomain}
                          xScale={this.state.xScale}
                          dragging={this.state.dragging}
                          featureAxisOnEnd={this.featureAxisOnEnd}
                          size={this.state.featureCoordinatesSize}
                          sendData={this.sendData}
                          colorFunction={this.state.colorFunction}
                          markovBlanket={this.props.markovBlanket}
                      />
                  </div>
              </Tab>
              <Tab linkClassName={"Metrics Graph"}>
                  <div className={"column"}>
                      <ProgressGraph size={[500, 300]}
                                     name={"consistency"}
                                     consistencyScores={this.state.consistencyScores}
                                     currentScores={this.state.currentScores}
                                     colors={this.state.progressGraphKeyColor}
                                     selectedIndex={this.state.selectedIndex}
                                     updateIndex={this.updateIndex}
                                     xAxisLength={this.state.xAxisLength}
                                     goToStep={(s) => this.goToStep(s)}
                      />
                      <Legend keys={this.state.progressGraphKeys} colors={this.state.progressGraphKeyColor}/>
                  </div>
              </Tab>
              <Tab linkClassName={"Results"}>
                  <div className={"column-left"}>
                      {metricsGraph}
                      {metricsLegend}
                  </div>
              </Tab>
              <Tab linkClassName={"Histograms"}>
                  <div className={"column"}>
                      {settings}
                      {histograms}
                  </div>
              </Tab>
 */
