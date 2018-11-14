class AppInterface extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    var colorRange = ["#e31a1c", "#fdbf6f", "#33a02c", "#a6cee3", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ];
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames);
    var featureCoordinatesSize = [1200,500];

    /* FEATURE IMPORTANCE */
    var circleRadii = [250];
    var radius = 16;
    var rankedFeatures = {};
    this.props.features.features.map(feature => {
        feature.rank = 0;
        feature.circleIndex = 0;
        var pt_angle = Math.random() * 2 * Math.PI;
        var randomRadius = Math.sqrt(Math.random() * Math.pow((circleRadii[feature.circleIndex] - radius), 2));
        var pt_radius_sq = randomRadius * randomRadius;
        feature.radius = randomRadius;
        feature.x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
        feature.y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
        rankedFeatures[feature.index] = feature;
    });

    this.state = {
        activeTabIndex: 0,
        featureSelectionMargin : {left: 10, right: 30, top: 20, bottom:10 },
        causalGraph: {
            showComponent: false,
            markovBlanketSelected: false,//this.props.markovBlanketSelected,
            isEdgeSelected: false,//this.props.isEdgeSelected,
            isNodeSelected: false,//this.props.isNodeSelected,
            graphHistory: []//[{ graph: this.props.graph, dotSrc: this.props.dotSrc }],
        },
        shouldInitializeGraph: true,
        graphIndex: -1,
        featureImportanceSize: [1000, 500],
        featureImportance: {
            circleRadii: [250],
            features: rankedFeatures, // initialized to null object
        },
        featureImportanceMoves: [],
        featureImportanceStep: 0,
        shouldInitializeSelection: true,
        featureSelection: {
            showComponent: false,
            xScaleDomain: null,
            xScale: null,
            features: {}
        },
        showAnalysis: false,
        featureSelectionAxisWidthSelected: 75,
        featureSelectionAxisWidthNotSelected: 50,
        analysis: {
            showComponent: false
        },
        MB:{
            score: []
        },
        MBCurrent: {
            score: -1
        },
        MI:{
            score: []
        },
        MICurrent: {
            score: -1
        },
        metrics: {
            accuracy: [],
            precision: []
        },
        confusionMatrix: [[]],
        confusionMatrixNormalized: [[]],
        consistencyGraphLegend: {
            keys: ["MB consistency", "Mutual Information"],
            colors: ["#e31a1c", "#feb24c"],
            max: 1
        },
        metricsGraphLegend: {
            keys: ["accuracy", "precision"],
            colors: ["#3690c0", "#d0d1e6"]
        },
        rankLoss: {
            score:[]
        },
        rankLossCurrent: {
            score: -1
        },
        rankLossGraphLegend: {
            keys: ["rank loss"],
            colors: ['#016450']
        },
        featureData: {
            inputData: this.props.features.inputData,
            classDisplay: this.props.features.classDisplay
        },
        selectedFeatureNames: [],
        featureRank: {},
        rankData: [],
        indexToFeatureMap: {},
        numRanks: 1, // number of circles in feature Importance
        featureHistory: [],
        step: 0,
        dragging: {},
        colorRange: colorRange,
        colorFunction: color,
        featureCoordinatesSize: featureCoordinatesSize,
        markovBlanketFeatureNames: new Set(),
        coveredFeatures: new Set(),
        xAxisLength: 2,
        selectedIndex: 0,
        showInfo: false
    };
    //console.log(this.state)
    /* FEATURE IMPORTANCE METHODS */
      this.calculateNewCircleRadius = this.calculateNewCircleRadius.bind(this);
      this.addCircle = this.addCircle.bind(this);
      this.addMove = this.addMove.bind(this);
      this.undo = this.undo.bind(this);
      this.updateFeatureRank = this.updateFeatureRank.bind(this);

      /* CAUSAL GRAPH METHODS */
      this.goFromGraphToImportance = this.goFromGraphToImportance.bind(this);
      this.getGraphDataToLog = this.getGraphDataToLog.bind(this);

      /* FEATURE SELECTION METHODS */
      this.calculateFeatureSelectionXScale = this.calculateFeatureSelectionXScale.bind(this);
      this.sendGraphToSelection = this.sendGraphToSelection.bind(this);
      this.featureAxisOnEnd = this.featureAxisOnEnd.bind(this);
      this.goFromSelectionToGraph = this.goFromSelectionToGraph.bind(this);
      this.calculateCoverage = this.calculateCoverage.bind(this);
      this.isTherePathToClass = this.isTherePathToClass.bind(this);

      /* OTHER */
      this.toggleAnalysis = this.toggleAnalysis.bind(this);
      this.goFromAnalysisToSelection = this.goFromAnalysisToSelection.bind(this);


    this.sendData = this.sendData.bind(this);
    this.removeLastGraph = this.removeLastGraph.bind(this);
    this.clearGraph = this.clearGraph.bind(this);
    this.getNodeIndexToFeatureMap = this.getNodeIndexToFeatureMap.bind(this);
    this.getMarkovBlanketFeatureNames = this.getMarkovBlanketFeatureNames.bind(this);

    this.position = this.position.bind(this);
    this.sendImportanceToGraph = this.sendImportanceToGraph.bind(this);
    this.classify = this.classify.bind(this);
    this.updateIndex = this.updateIndex.bind(this);
    this.goToStep = this.goToStep.bind(this);
    this.getInitialConsistencyScores = this.getInitialConsistencyScores.bind(this);
    this.initializeRankData = this.initializeRankData.bind(this);
    this.updateNumRanks = this.updateNumRanks.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.showInfoTrue = this.showInfoTrue.bind(this);
    this.showInfoFalse = this.showInfoFalse.bind(this);
    this.initializeForbiddenEdges = this.initializeForbiddenEdges.bind(this);
    this.initializeRequiredEdges = this.initializeRequiredEdges.bind(this);
    this.initializeFeatureNameToRankMap = this.initializeFeatureNameToRankMap.bind(this);

  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  /* FEATURE IMPORTANCE  */
    calculateNewCircleRadius(){
        const numberCircle = this.state.featureImportance.circleRadii.length + 1;
        const largeCircleRadius = this.state.featureImportance.circleRadii[0];
        var newCircleRadii = [];
        for (var i = numberCircle; i > 0; i--) {
            newCircleRadii.push(largeCircleRadius/numberCircle * i)
        }
        return newCircleRadii
    }

    addCircle() {
        const newCircleRadii = this.calculateNewCircleRadius(); //currentCircleRadii.concat(newRadius)
        this.state.featureImportanceMoves.push({type: "circle", circleRadii: this.state.featureImportance.circleRadii, features: this.state.featureImportance.features});

        client.recordEvent('feature_importance_moves', {
            user: userID,
            type: "add_circle",
            numCircles: this.state.featureImportance.circleRadii.length
        });

        this.state.featureImportanceStep = this.state.featureImportanceStep + 1;
        Object.keys(this.state.featureImportance.features).map((key) => {
            this.updateFeatureRank(key, this.state.featureImportance.circleRadii.length - this.state.featureImportance.features[key].circleIndex)
        });

        this.setState({
            featureImportance: {
                circleRadii: newCircleRadii,
                features: this.state.featureImportance.features
            }
        });
    }

    addMove(move) {
        client.recordEvent('feature_importance_moves', {
           user: userID,
           type: "move_feature",
           feature: {
               name: this.state.featureImportance.features[move.id].name,
               id : move.id
           },
           circleIndex: {
               old: move.circleIndex,
               new: move.newCircleIndex
           },
           numCircles: this.state.featureImportance.circleRadii.length
        });

        this.state.featureImportanceMoves.push(move);
        this.state.featureImportanceStep = this.state.featureImportanceStep + 1;
        if (move.type == 'feature') {
            if (move.newCircleIndex == this.state.featureImportance.circleRadii.length - 1 || move.newCircleIndex == -1 || move.circleIndex == this.state.featureImportance.circleRadii.length - 1 || move.circleIndex == -1) {
                this.state.shouldInitializeGraph = true;
            }
        }
    }

    undo() {
        if (this.state.featureImportanceStep > 0) {
            const step = this.state.featureImportanceStep;
            const lastStep = this.state.featureImportanceMoves[step - 1];
            if (lastStep.type == "feature"){
                const featureId = lastStep.id;
                this.state.featureImportance.features[featureId].circleIndex = lastStep.circleIndex;
                this.state.featureImportance.features[featureId].radius = lastStep.radius;
                this.state.featureImportance.features[featureId].x = lastStep.position.x;
                this.state.featureImportance.features[featureId].y = lastStep.position.y;
                const selector = '[id=\"' + featureId + '"]';
                console.log(d3.select(selector).attr("transform", "translate(" + lastStep.position.x +  "," + lastStep.position.y + ")"));
                this.state.featureImportanceMoves.splice(step - 1);
                this.setState({
                    featureImportanceMoves: this.state.featureImportanceMoves,
                    featureImportanceStep: step - 1
                });
            } else {
                this.state.featureImportanceMoves.splice(step - 1);
                this.state.featureImportanceStep = step - 1;
                this.setState({
                    featureImportance: {
                        circleRadii: lastStep.circleRadii,
                        features: this.state.featureImportance.features
                    }
                })
            }
        }
    }

    updateFeatureRank(featureId, rank) {
        //console.log(featureId, rank);
        this.state.featureImportance.features[featureId].rank = rank;
        this.state.featureRank[this.state.featureImportance.features[featureId].name] = rank;
    }

    initializeFeatureNameToRankMap() {

        var featureRankToNamesMap = {};
        for (var i = 0; i <= this.state.featureImportance.circleRadii.length; i++) {
            featureRankToNamesMap[i] = [];
        }
        Object.keys(this.state.featureImportance.features).map(key => {
            //featureNameToRankMap[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].rank;
            featureRankToNamesMap[this.state.featureImportance.features[key].rank].push(this.state.featureImportance.features[key].name);
        });

        var nextRank = 0;
        var featureRankNoEmpty = {};
        for (var i = 0; i <= this.state.featureImportance.circleRadii.length; i++) {
            if (featureRankToNamesMap[i].length != 0) {
                featureRankNoEmpty[nextRank] = featureRankToNamesMap[i];
                nextRank = nextRank + 1;
            }
        }
        var featureNameToRankMap = {};
        Object.keys(featureRankNoEmpty).map((rank) =>
            featureRankNoEmpty[rank].map(name =>
                featureNameToRankMap[name] = +rank
            )
        );
        //console.log(featureNameToRankMap)
        this.state.featureRank = featureNameToRankMap;
        return { featureNameToRankMap: featureNameToRankMap, featureRankToNamesMap: featureRankToNamesMap } ;
    }

    initializeForbiddenEdges() {
        var forbiddenEdges = [];
        var lowestRankFeatures = [];
        Object.keys(this.state.featureImportance.features).map(key => {
            if (this.state.featureImportance.features[key].circleIndex == -1) {
                forbiddenEdges.push([this.state.featureImportance.features[key].name, "CLASS"]);
                lowestRankFeatures.push(this.state.featureImportance.features[key].name);
            }
        });
        return { forbiddenEdges: forbiddenEdges, lowestRankFeatures: lowestRankFeatures } ;
    }

    initializeRequiredEdges() {
        var requiredEdges = [];
        var highestRankFeatures = [];
        if (this.state.featureImportance.circleRadii.length > 1) {
            Object.keys(this.state.featureImportance.features).map(key => {
                if (this.state.featureImportance.features[key].circleIndex == this.state.featureImportance.circleRadii.length - 1) {
                    requiredEdges.push([this.state.featureImportance.features[key].name, "CLASS"]);
                    highestRankFeatures.push(this.state.featureImportance.features[key].name);
                }
            });
        }
        return { requiredEdges: requiredEdges, highestRankFeatures: highestRankFeatures } ;
    }

    // 1 -> 2
    sendImportanceToGraph() {
        if (this.state.shouldInitializeGraph) {
            var featureRanks = this.initializeFeatureNameToRankMap();

            // initialize forbidden and required edges
            var forbiddenEdgesInfo = this.initializeForbiddenEdges();
            var requiredEdgesInfo = this.initializeRequiredEdges();

            /* capture feature importance */
            client.recordEvent('feature_importance_snap_shot', {
                user: userID,
                lowestRankFeatures: forbiddenEdgesInfo.lowestRankFeatures,
                highestRankFeatures: requiredEdgesInfo.highestRankFeatures,
                featureNameToRank: featureRanks.featureNameToRankMap,
                featureRankToNames: featureRanks.featureRankToNamesMap
            });

            // send prior to graph and initialize graph
            this.sendData("/initializeGraph", {
                forbiddenEdges: forbiddenEdgesInfo.forbiddenEdges,
                requiredEdges: requiredEdgesInfo.requiredEdges
            });

        } else {

            /* record user viewing feature importance */
            client.recordEvent('feature_importance_view_page_only', {
                user: userID
            });
        }

        // set tab index to graph index
        this.setState({
            activeTabIndex: 1,
            shouldInitializeGraph: false
        });
    }

    /* CAUSAL GRAPH METHODS */
    goFromGraphToImportance() {
        this.setState({
            activeTabIndex: 0
        });
    }


  showInfoTrue() {
      this.setState({
          showInfo: true
      })
  }

  showInfoFalse() {
      this.setState({
          showInfo: false
      })
  }

  handleTabClick(tabIndex) {
      this.setState({
          activeTabIndex: tabIndex === this.state.activeTabIndex ? this.props.defaultActiveTabIndex : tabIndex
      });
    }

  getGraphDataToLog(inputGraph) {
        var graph = {};
        Object.keys(inputGraph).map((featureName) => {
            graph[featureName] = []
            //graph[featureName].edgeTo = []
        });
        Object.keys(inputGraph).map((featureName) => {
            Object.keys(inputGraph[featureName].edgeTo).map((toNodeName) => {
                graph[featureName].push(toNodeName);
            });
        });
        return graph;
  }

  sendData(url, dataToSend) {
    //console.log(dataToSend);
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }).then(function(response) {
      return response.json();
    }).then(data => {
        var graph = this.getGraphDataToLog(data.graph);
        //this.props.sendData("/addEdge", {"nodeFrom": firstNode, "nodeTo": secondNode });
        if (url == '/addEdge') {
            client.recordEvent('graph_history', {
                user: userID,
                type: "add_edge",
                info: [dataToSend.nodeFrom, dataToSend.nodeTo],
                graph: graph
            });
        }

        //this.props.sendData("/redrawGraph", {features: [removedNode], removedEdges: this.state.removedEdges } )
        if (url == '/redrawGraph') {
            client.recordEvent('graph_history', {
                user: userID,
                type: "remove_node",
                info: dataToSend.features[0],
                graph: graph
            });
        }

        // this.sendData("/initializeGraph", {forbiddenEdges: forbiddenEdgesInfo.forbiddenEdges,requiredEdges: requiredEdgesInfo.requiredEdges});
        if (url == "/initializeGraph") {
            client.recordEvent('graph_history', {
                user: userID,
                type: "initial_graph",
                info: dataToSend,
                graph: graph
            });
        }

        const currentGraphHistory = this.state.causalGraph.graphHistory.splice(0, this.state.graphIndex + 1);
        this.setState({
            causalGraph: {
                showComponent: true,
                markovBlanketSelected: data.markovBlanketSelected,
                isEdgeSelected: data.isEdgeSelected,
                isNodeSelected: data.isNodeSelected,
                graphHistory: currentGraphHistory.concat([ { graph: data.graph, dotSrc: data.dotSrc } ]),
            },
            graphIndex: currentGraphHistory.length,
            shouldInitializeSelection: true,
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
      var inputGraph = this.state.causalGraph.graphHistory[currentIndex - 1];
      var graph = this.getGraphDataToLog(inputGraph);
      client.recordEvent('graph_history', {
         user: userID,
         type: "undo",
         info: [],
         graph: graph
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
      var inputGraph = this.state.causalGraph.graphHistory[0];
      var graph = this.getGraphDataToLog(inputGraph);
      client.recordEvent('graph_history', {
          user: userID,
          type: "clear",
          info: [],
          graph: graph
      });
      this.setState({
          graphIndex: 0
      });
  }

  // causalGraph node index to feature name map
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
    var markovBlanketFeatureIndexes = new Set();
    nodeList.map((nodes) => {
      nodes.map((nodeIndex) => {
        markovBlanketFeatureNames.add(indexToFeatureMap[nodeIndex]);
        markovBlanketFeatureIndexes.add(nodeIndex);
      })
    });
    this.state.markovBlanketFeatureIndexes = markovBlanketFeatureIndexes;
    return markovBlanketFeatureNames;
  }

  /*getInitialFeatureRank(markovBlanketFeatureNames) {
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
  }*/

  /* FEATURE SELECTION METHODS */
  calculateFeatureSelectionXScale(features) {
      var foundBoundary = false;
      //var featureSelectionWidth = this.state.featureCoordinatesSize[0] - this.state.featureSelectionMargin.left - this.state.featureSelectionMargin.right;
      var xScaleRange = [];
      var nextPosition = 0;
      var numSelectedFeatures = 0;
      for (var i = 0; i < features.length; i++) {
          xScaleRange.push(nextPosition);
          if (features[i].name == "BOUNDARY") {
              foundBoundary = true;
              numSelectedFeatures = i;
          }
          if (foundBoundary) {
              nextPosition = nextPosition + this.state.featureSelectionAxisWidthNotSelected;
          } else {
              nextPosition = nextPosition + this.state.featureSelectionAxisWidthSelected;
          }
      }

      var xScaleDomain = features.map((feature, index) =>
          feature.name
      );
      var xScale = d3.scaleOrdinal()
          .domain(xScaleDomain)
          .range(xScaleRange);

      var featureSelectionTotalWidth = numSelectedFeatures * this.state.featureSelectionAxisWidthSelected + (features.length - numSelectedFeatures) * this.state.featureSelectionAxisWidthNotSelected + this.state.featureSelectionMargin.left + this.state.featureSelectionMargin.right;

      return {xScale: xScale, xScaleDomain: xScaleDomain, featureSelectionTotalWidth: featureSelectionTotalWidth};
  }

  sendGraphToSelection() {
      if (this.state.shouldInitializeSelection) {
          const currentIndex = this.state.graphIndex;
          const currentGraph = this.state.causalGraph.graphHistory[currentIndex].graph;
          var indexToFeatureMap = this.getNodeIndexToFeatureMap(currentGraph);
          this.state.indexToFeatureMap = indexToFeatureMap;
          var markovBlanketFeatureNames = this.getMarkovBlanketFeatureNames(indexToFeatureMap, currentGraph.CLASS);
          this.state.markovBlanketFeatureNames = markovBlanketFeatureNames;

          this.initializeRankData();

          var featuresWithBoundary = [];
          Object.keys(this.state.featureImportance.features).map((featureKey) => {
              if (this.state.markovBlanketFeatureNames.has(this.state.featureImportance.features[featureKey].name)) {
                  featuresWithBoundary.unshift(this.state.featureImportance.features[featureKey]);
              } else {
                  featuresWithBoundary.push(this.state.featureImportance.features[featureKey]);
              }
          });

          featuresWithBoundary.splice(this.state.markovBlanketFeatureNames.size, 0,
              {
                  index: featuresWithBoundary.length,
                  display: true,
                  name: "BOUNDARY",
                  type: "continuous",
                  range: [0, 0]
              });

          var xScaleInfo = this.calculateFeatureSelectionXScale(featuresWithBoundary);

          var allFeatureNames = this.getInitialConsistencyScores(featuresWithBoundary);

          /*client.recordEvent('feature_selections', {

          }); */

          this.setState({
              featureSelection: {
                  xScaleDomain: xScaleInfo.xScaleDomain,
                  xScale: xScaleInfo.xScale,
                  features: featuresWithBoundary
              },
              MBCurrent: {
                  score: 1
              },
              selectedFeatureNames: allFeatureNames,
              activeTabIndex: 2,
              featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500],
              shouldInitializeSelection: false,
              coveredFeatures: this.state.markovBlanketFeatureNames
          });
      } else {

          this.setState({
              activeTabIndex: 2,
          });
      }
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

            var EK = d3.select('#expert-knowledge');
            allFeatureIndexes.map(index => {
                var stringId = '#' + index;
                EK.select(stringId).raise().classed("ek-selected", true)
            });

            var xScaleInfo = this.calculateFeatureSelectionXScale(features); //this.state.featureSelection.xScale.domain(xScaleDomain);

            this.calculateScores({ features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: this.state.featureRank });
            let coveredFeatures = this.calculateCoverage(allFeatureNames);
            let MBScore = coveredFeatures.size/ this.state.markovBlanketFeatureNames.size
            //console.log(coveredFeatures)
            this.setState({
                featureSelection: {
                    xScale: xScaleInfo.xScale,
                    xScaleDomain: xScaleInfo.xScaleDomain,
                    features: features
                },
                MBCurrent: {
                    score: MBScore
                },
                selectedFeatureNames: allFeatureNames,
                featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500],
                coveredFeatures: coveredFeatures
            });
        }
    }

    goFromSelectionToGraph() {
      this.setState({
          activeTabIndex: 1
      })
    }

  classify() {
    if (this.state.MICurrent.score >= 0) {

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
        this.state.MI.score.push(this.state.MICurrent.score);
        this.state.MB.score.push(this.state.MBCurrent.score);
        this.state.rankLoss.score.push(this.state.rankLossCurrent.score);
        this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)));
        this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)));

        client.recordEvent('classify_results', {
           user: userID,
           MI: this.state.MICurrent.score,
           MB: this.state.MBCurrent.score,
           rankLoss: this.state.rankLossCurrent.score,
           accuracy: +data.accuracy.toFixed(3),
           precision: +data.precision.toFixed(3),
           features: features.features
        });
        this.setState({
          confusionMatrixNormalized: data.confusionMatrixNormalized,
          confusionMatrix: data.confusionMatrix,
          MI: {
              score: this.state.MI.score
          },
          MB: {
              score: this.state.MB.score
          },
          MICurrent: {
              score: -1
          },
          MBCurrent: {
              score: -1
          },
          metrics: {
            precision: this.state.metrics.precision,
            accuracy: this.state.metrics.accuracy
          },
          rankLoss: this.state.rankLoss,
          rankLossCurrent: {
              score: -1,
          },
          activeTabIndex: 3
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
          if (this.state.MB.score.length >= 2 && this.state.MBCurrent.score == -1) {
              axisLength = axisLength + 1;
              selectedIndex = selectedIndex + 1;
          }
          //console.log(axisLength);
          client.recordEvent('feature_selection' ,{
              MI: parseFloat(data.MI.toFixed(3)),
              //MB: parseFloat(data.consistencyMB.toFixed(3)),
              rankLoss: parseFloat(data.rankLoss.toFixed(3)),
              features: dataToSend.names
          });

          this.setState({
              MICurrent: {
                  //MB: parseFloat(data.consistencyMB.toFixed(3)),
                  score: parseFloat(data.MI.toFixed(3)),
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

  calculateCoverage(selectedFeatures) {
    // start with the nodes directly linked to class node
      var graph = this.state.causalGraph.graphHistory[this.state.graphIndex].graph;
      console.log(graph)
      var selectedFeatureIndexes = [];
      var coveredNodeIndexes = new Set();
      //console.log(selectedFeatures);
      selectedFeatures.map(feature => {
          console.log(feature)
          selectedFeatureIndexes.push(graph[feature].nodeIndex);
      });

      var visited = [];
      var coveredIndexes = new Set();
      selectedFeatureIndexes.map(index => {
          if (!visited.includes(index)) {
              var currentVisit = this.isTherePathToClass(graph, selectedFeatureIndexes, this.state.markovBlanketFeatureIndexes, visited, coveredIndexes, index);
              visited = currentVisit;
          }
      });
      var visitedBackwards = [];
      selectedFeatureIndexes.map(index => {
          if (!visitedBackwards.includes(index)) {
              var currentVisit = this.isTherePathFromClass(graph, selectedFeatureIndexes, this.state.markovBlanketFeatureIndexes, visitedBackwards, coveredIndexes, index);
              visitedBackwards = currentVisit;
          }
      });
      //this.state.coveredFeatures
      //console.log(coveredIndexes);

      var coveredFeatures = new Set();
      Array.from(coveredIndexes).map((index) =>
        coveredFeatures.add(this.state.indexToFeatureMap[index])
      );

      return coveredFeatures;
  }

  isTherePathFromClass(graph, selectedFeatureIndexes, markovBlanketFeatureIndexes, visitedIndexes, coveredIndexes, currentFeatureIndex) {
      var nodeFrom = graph[this.state.indexToFeatureMap[currentFeatureIndex]].nodeFrom;
      var visited = visitedIndexes.slice();
      visited.push(currentFeatureIndex);
      if (markovBlanketFeatureIndexes.has(currentFeatureIndex)) {
          coveredIndexes.add(currentFeatureIndex);
          return visited;
      }
      nodeFrom.map((node) =>{
          console.log(node);
          console.log(markovBlanketFeatureIndexes);
          console.log(markovBlanketFeatureIndexes.has(node));
          if (markovBlanketFeatureIndexes.has(node)) {
              coveredIndexes.add(node);
          }
          if (selectedFeatureIndexes.includes(node)) {
              return this.isTherePathFromClass(graph, selectedFeatureIndexes, markovBlanketFeatureIndexes, visited, coveredIndexes, node);
          }
      });
      return visited;
  }

  isTherePathToClass(graph, selectedFeatureIndexes, markovBlanketFeatureIndexes, visitedIndexes, coveredIndexes, currentFeatureIndex) {
      var nodeTo = graph[this.state.indexToFeatureMap[currentFeatureIndex]].nodeTo;
      var visited = visitedIndexes.slice();
      visited.push(currentFeatureIndex);
      if (markovBlanketFeatureIndexes.has(currentFeatureIndex)) {
          coveredIndexes.add(currentFeatureIndex);
          return visited;
      }
      console.log(nodeTo);
      console.log(selectedFeatureIndexes);
      nodeTo.map((node) =>{
          if (markovBlanketFeatureIndexes.has(node)) {
              coveredIndexes.add(node);
          }
          if (selectedFeatureIndexes.includes(node)) {
              return this.isTherePathToClass(graph, selectedFeatureIndexes, markovBlanketFeatureIndexes, visited, coveredIndexes, node);
          }
      });
      return visited;
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
        client.recordEvent('class_display_settings', {
            user: userID,
            class: className,
            display: currentDisplay
        });
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

  initializeRankData() { //initialize map of feature name to rank
      /*var featureRankMap = {};
      Object.keys(this.state.featureImportance.features).map(key =>
          featureRankMap[this.state.featureImportance.features[key].name] = this.state.featureImportance.features[key].circleIndex + 1
      ); */
      var featureNameToRankMap = this.state.featureRank;
      console.log(featureNameToRankMap);
      var featureNames = Object.keys(featureNameToRankMap);
      var rankData = [];
      for (var i = 0; i <= this.state.featureImportance.circleRadii.length; i++) {
          rankData.push({ rank: i, MB:[], NotMB: []})
      }
      // sort featureNames by MB or Not MB and by rank
      featureNames.map((name) => {
          if (this.state.markovBlanketFeatureNames.has(name)) {
              //console.log(rankData)
              //console.log(featureNameToRankMap[name])
              rankData[featureNameToRankMap[name]].MB.push(name);
          } else {
              rankData[featureNameToRankMap[name]].NotMB.push(name);
          }
      });

      /* convert key to object
      var rankDataArray = [];
      Object.keys(rankData).map((key) => {
          rankData[key].rank = key
          rankDataArray.push(rankData[key])
      }); */

      this.state.rankData = rankData;
      return rankData;
  }

  /* OTHER */
    toggleAnalysis() {
        this.setState({
            showAnalysis: !this.state.showAnalysis
        })
    }

    goFromAnalysisToSelection() {
        this.setState({
            activeTabIndex: 2
        })
    }

  render() {
    var metricsGraphMax = Math.max(this.state.consistencyGraphLegend.max, this.state.MICurrent.score);
    this.state.consistencyGraphLegend.max = metricsGraphMax;
    var featureInfo = [{name: "hi", description: "hello"}];
    var rankLossMax = this.state.rankLossCurrent.score;
    rankLossMax = Math.max(rankLossMax, Math.max.apply(null, this.state.rankLoss.score)) + 1;
      var currentGraphHistory;
    if (this.state.graphIndex >= 0) {
        currentGraphHistory = this.state.causalGraph.graphHistory[this.state.graphIndex];
    } else {
        currentGraphHistory = {graph: {}, dotSrc: ""}
    }
      return (
        <div className={'root-div'}>
            <SideBar featureInfo={this.props.description} show={this.state.showInfo} close={() => this.showInfoFalse()}/>
            <button className={"sidebar-toggle"} onClick={this.showInfoTrue}>{"☰"}</button>
          <Tabs activeTabIndex={this.state.activeTabIndex} handleTabClick={(t) => this.handleTabClick(t)}>
              <Tab linkClassName={"Feature Importance"}>
                <ExpertKnowledge
                    colorRange={this.state.colorRange}
                    circleRadii={this.state.featureImportance.circleRadii}
                    addCircle={this.addCircle}
                    moves={this.state.featureImportanceMoves}
                    addMove={this.addMove}
                    step={this.state.featureImportanceStep}
                    undo={this.undo}
                    features={this.state.featureImportance.features}
                    updateFeatureRank={(r, f) => this.updateFeatureRank(r, f)}
                    updateNumRanks={(r) => this.updateNumRanks(r)}
                    width={1000}
                    height={500}
                    nextStep={this.sendImportanceToGraph}
                />
              </Tab>
              <Tab linkClassName={"Causal Graph"}>
                  <CausalGraph
                      dotSrc={currentGraphHistory.dotSrc}
                      sendData={this.sendData}
                      graph={currentGraphHistory.graph}
                      markovBlanketSelected={this.state.causalGraph.markovBlanketSelected}
                      isEdgeSelected={this.state.causalGraph.isEdgeSelected}
                      isNodeSelected={this.state.causalGraph.isNodeSelected}
                      undoNodeRemoval={(n) => this.removeLastGraph(n)}
                      clearGraph={this.clearGraph}
                      nextStep={this.sendGraphToSelection}
                      prevStep={this.goFromGraphToImportance}
                      getGraphDataToLog={this.getGraphDataToLog}
                  />
              </Tab>
              <Tab linkClassName={"Feature Selection"}>
                  <div>
                      <div className={"tools-bar"}>
                          <button className={"tools-bar"} style={{background: this.state.showAnalysis? "#0071e0" : "darkgray"}} onClick={this.toggleAnalysis}>{"Analysis"}</button>
                          <button className={"tools-bar right-button next-button"} onClick={this.classify}>{"CLASSIFY »"}</button>
                          <button className={"tools-bar right-button previous-button"} onClick={this.goFromSelectionToGraph}>{"« PREVIOUS"}</button>
                      </div>

                      <div style={{display: this.state.showAnalysis? "none" : "block"}}>
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
                          <Legend className={"legend"}
                                  keys={this.props.classNames}
                                  colors={this.state.colorRange}/>
                      <CheckboxMultiSelect options={this.state.featureData.classDisplay}
                                           handleChange={(c, d) => this.handleClassSelection(c, d)}/>
                      </div>
                      <div className={"grid-container"} style={{display: this.state.showAnalysis? "grid" : "none"}}>
                          <div className={"grid-item"}>
                              <ProgressGraph size={[500, 300]}
                                             max={this.state.consistencyGraphLegend.max}
                                             min={0}
                                             name={"consistency"}
                                             consistencyScores={{MB: this.state.MB.score, MI: this.state.MI.score }}
                                             metrics={{accuracy: [], precision: []}}
                                             metricsColors={this.state.metricsGraphLegend.colors}
                                             currentScores={{ MB: this.state.MBCurrent.score, MI: this.state.MICurrent.score }}
                                             colors={this.state.consistencyGraphLegend.colors}
                                             selectedIndex={this.state.selectedIndex}
                                             updateIndex={this.updateIndex}
                                             xAxisLength={this.state.xAxisLength}
                                             goToStep={(s) => this.goToStep(s)}
                              />
                              <Legend className={"legend"}
                                  keys={this.state.consistencyGraphLegend.keys}
                                      colors={this.state.consistencyGraphLegend.colors}/>
                          </div>
                          <div className={"grid-item"}>
                              <PieChart size={[400,300]}
                                        data={Array.from(this.state.markovBlanketFeatureNames)}
                                        selection={Array.from(this.state.coveredFeatures)}
                              />
                          </div>
                          <div className={"grid-item"}>
                              <Legend className={"legend legend-left"}
                                  keys={["Covered", "Not Covered"]}
                                      colors={["#b9d9ff", "#a9a9a9"]}/>
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
                              <Legend className={"legend"}
                                  keys={this.state.rankLossGraphLegend.keys}
                                      colors={this.state.rankLossGraphLegend.colors}/>
                          </div>
                          <div className={"grid-item"}>
                              <SunburstChart size={[400,300]}
                                             data={this.state.rankData}
                                             selection={this.state.selectedFeatureNames}
                              />
                          </div>
                          <div className={"grid-item"}>
                              <Legend className={"legend legend-left"}
                                  keys={['In MB', 'Not in MB']}
                                      colors={['#7e6699', '#f08036']}/>
                          </div>
                      </div>
                  </div>
              </Tab>
              <Tab linkClassName={"Performance Analysis"}>
                  <div className={"tools-bar"}>
                      <button className={"tools-bar right-button previous-button"} onClick={this.goFromAnalysisToSelection}>{"« PREVIOUS"}</button>
                  </div>
                <ConfusionMatrix
                    matrix={this.state.confusionMatrix}
                    normalizedMatrix={this.state.confusionMatrixNormalized}
                    classNames={this.props.classNames}
                />
                  <div className={"grid-container"}>
                  <div>
                      <ProgressGraph size={[500, 300]}
                                     max={1}
                                     min={0}
                                     name={"consistency"}
                                     consistencyScores={this.state.metrics}
                                     metrics={{accuracy: [], precision: []}}
                                     metricsColors={this.state.metricsGraphLegend.colors}
                                     currentScores={{accuracy: -1, precision: -1}}
                                     colors={this.state.metricsGraphLegend.colors}
                                     selectedIndex={this.state.selectedIndex}
                                     updateIndex={this.updateIndex}
                                     xAxisLength={this.state.xAxisLength}
                                     goToStep={(s) => this.goToStep(s)}
                      />
                      <Legend className={"legend"}
                              keys={this.state.metricsGraphLegend.keys}
                              colors={this.state.metricsGraphLegend.colors}/>
                  </div>
              </div>
              </Tab>
          </Tabs>
        </div>
      )
  }
}