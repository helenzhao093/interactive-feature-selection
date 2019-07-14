class AppInterface extends React.Component {
  constructor(props) {
    super(props);
    var colorRange = ["#e31a1c", "#fdbf6f", "#33a02c", "#a6cee3", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ];
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames);
    var FIcolorFunction = d3.scaleOrdinal().range(d3.schemeBlues[5]).domain([0, 1, 2, 3, 4]);


    /* FEATURE IMPORTANCE */
    var circleRadii = [250];
    var radius = 16;
    var rankedFeatures = {};

    var nameToIndexMap = {};
      this.props.features.features.map(feature => {
          nameToIndexMap[feature.name] = feature.index
      });

    var ROCDisplayClass = {};
    this.props.classNames.map((label) => {
      ROCDisplayClass[label] = {}
      ROCDisplayClass[label].TP = {}
      ROCDisplayClass[label].TP.display = true
    });

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

    let helptext = [
        "-Express prior knowledge about the predictive power of features.\n" +
        "-Place features with higher predictive powers closer to the innermost circle.\n" +
        "-Features outside of the circles have no predictive power.\n" +
        "-Feature importance is used to in building the causal graph.",

        "-A causal graph is a possible model of the causes and effects relationships between features.\n" +
        "-Each feature is represented as a node in the graph.\n" +
        "-A feature this is a direct cause of another has an edge starting from the cause and going to the effect.\n" +
        "-Graph can be modified to be consistent with your prior knowledge about the features.\n",

        "-Each axis represents a feature. \n" +
        "-Each line represents an example. The example intersects each feature axis at the value for the feature.  \n" +
        "-Default feature selection is the markov blanket of the target variable.\n" +
        "-Features to the left of the BOUNDARY line is the selected feature set.\n" +
        "-Drag axis to reposition them or add/remove them from selected feature set.",

        "-The performance of the classifier build using the selected feature set."
    ];

    this.state = {
        datasetName: this.props.datasetName,
        nameToIndexMap: nameToIndexMap,
        helptext: helptext,
        activeTabIndex: 0,
        featureSelectionMargin : {left: 10, right: 30, top: 20, bottom:10 },
        causalGraph: {
            graphHistory: []
        },
        shouldInitializeGraph: true,
        graphIndex: -1,
        featureImportance: {
            circleRadii: [250],
            features: rankedFeatures, // initialized to null object
        },
        FIcolorFunction: FIcolorFunction,
        featureImportanceMoves: [],
        featureImportanceStep: 0,
        shouldInitializeSelection: true,
        featureSelection: {
            showComponent: false,
            xScaleDomain: null,
            xScale: null,
            features: {}
        },
        isNewTrial: false,
        selectedFeatureSelection: -1,
        featureSelectionHistory: [],
        showAnalysis: false,
        featureSelectionAxisWidthSelected: 75,
        featureSelectionAxisWidthNotSelected: 50,
        analysis: {
            showComponent: false
        },
        MB: [],
        MBCurrent: -1,
        MI: [],
        MICurrent: -1,
        metrics: {
            accuracy: [],
            accuracyTrain: [],
            precision: []
        },
        confusionMatrix: [],
        confusionMatrixNormalized: [],
        consistencyGraphLegend: [
            { value: "MB Consistency", color: '#e31a1c', helptext: "Percentage of the markov blanket feature that is covered" },
            { value: "Mutual Information", color: "#feb24c", helptext: "Amount of information explained by selected features" }
        ],
        consistencyGraphLegendMax: 1,
        metricsGraphLegend: [
            { value: "test accuracy", color: '#3690c0', helptext: "% of correctly predicted test ex. " },
            { value: "train accuracy", color: '#d0d1e6', helptext: "% of correctly predicted train ex. " }//,
           // { value: "precision", color: "#d0d1e6", helptext: "correct predictions/number of examples" }
        ],
        rankLoss: [],
        rankLossCurrent: -1,
        rankLossGraphLegend: [{ value: "rank loss", color: '#016450', helptext: "how much the importance of the selected features differ from the importance described in the feature importance tab" }],
        classDisplay:this.props.features.classDisplay,
        featureData: {
            inputData: this.props.features.inputData,
            convertedData: this.props.features.convertedData
        },
        featureRank: {},
        rankData: [],
        indexToFeatureMap: {},
        numRanks: 1,
        featureHistory: [],
        step: 0,
        dragging: {},
        colorRange: colorRange,
        colorFunction: color,
        markovBlanketFeatureNames: new Set(),
        xAxisLength: 2,
        showInfo: false,
        selectedTrial1: -1,
        selectedTrial2: -1,
        trials: [],
        rocCurve: [],
        ROCDisplayClass: ROCDisplayClass
    };
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
      this.changeDisplaySelection = this.changeDisplaySelection.bind(this);

      /* PROGRESS GRAPH METHODS */

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
    this.getInitialConsistencyScores = this.getInitialConsistencyScores.bind(this);
    this.initializeRankData = this.initializeRankData.bind(this);
    this.updateNumRanks = this.updateNumRanks.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.showInfoTrue = this.showInfoTrue.bind(this);
    this.showInfoFalse = this.showInfoFalse.bind(this);
    this.initializeForbiddenEdges = this.initializeForbiddenEdges.bind(this);
    this.initializeRequiredEdges = this.initializeRequiredEdges.bind(this);
    this.initializeFeatureNameToRankMap = this.initializeFeatureNameToRankMap.bind(this);

    this.changeDisplayTrial = this.changeDisplayTrial.bind(this);
    this.download = this.download.bind(this);

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
                forbiddenEdges.push([this.state.featureImportance.features[key].name, this.props.targetName]);
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
                    requiredEdges.push([this.state.featureImportance.features[key].name, this.props.targetName]);
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

            _LTracker.push({
                'eventName': 'feature importance snapshot',
                'userID': userID,
                'lowestRankFeatures': forbiddenEdgesInfo.lowestRankFeatures,
                'highestRankFeatures': requiredEdgesInfo.highestRankFeatures,
                'featureNameToRank': featureRanks.featureNameToRankMap,
                'featureRankToNames': featureRanks.featureRankToNamesMap
            })

            // send prior to graph and initialize graph
            this.sendData("/initializeGraph", {
                userId: userID,
                forbiddenEdges: forbiddenEdgesInfo.forbiddenEdges,
                requiredEdges: requiredEdgesInfo.requiredEdges
            });

        } else {

            _LTracker.push({
                'eventName': 'feature importance view page',
                'userId': userID,
            })
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
      /*this.setState({
          activeTabIndex: tabIndex === this.state.activeTabIndex ? this.props.defaultActiveTabIndex : tabIndex
      });*/
    }

  getGraphDataToLog(inputGraph) {
        console.log(inputGraph)
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

            _LTracker.push({
                'eventName': 'graph history',
                'type': 'add edge',
                'userId': userID,
                'info': [dataToSend.nodeFrom, dataToSend.nodeTo],
            })
        }

        //this.props.sendData("/redrawGraph", {features: [removedNode], removedEdges: this.state.removedEdges } )
        if (url == '/redrawGraph') {

            _LTracker.push({
                'eventName': 'graph history',
                'type': 'remove node',
                'userId': userID,
                'info': [dataToSend.nodeFrom, dataToSend.nodeTo],
            })
        }

        // this.sendData("/initializeGraph", {forbiddenEdges: forbiddenEdgesInfo.forbiddenEdges,requiredEdges: requiredEdgesInfo.requiredEdges});
        if (url == "/initializeGraph") {

        }

        const currentGraphHistory = this.state.causalGraph.graphHistory.splice(0, this.state.graphIndex + 1);
        this.setState({
            causalGraph: {
                graphHistory: currentGraphHistory.concat([ { graph: data.graph, dotSrc: data.dotSrc } ]),
            },
            graphIndex: currentGraphHistory.length,
            shouldInitializeSelection: true,
        })
    }).catch(function(error) {
      console.log(error)
    })
  }

  removeLastGraph(edit) {
      const currentIndex = this.state.graphIndex;

      fetch('/undoGraphEdit', {
          method: 'POST',
          body: JSON.stringify(edit)
      }).then(function(response) {
          return response.json();
      });

      if (currentIndex > 0) {
          this.setState({
              graphIndex: currentIndex - 1
          });
      }
  }

  clearGraph() {
      fetch('/clearGraph', {
          method: 'POST',
      }).then(function(response) {
          return response.json();
      });
      var inputGraph = this.state.causalGraph.graphHistory[0];
      var graph = this.getGraphDataToLog(inputGraph);
      _LTracker.push({
        'eventName': 'clear graph',
        'userId': userID,
    })

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


  /* FEATURE SELECTION METHODS */
  calculateFeatureSelectionXScale(features) {
      var foundBoundary = false;
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
      console.log(xScaleRange)

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
          this.state.shouldInitializeSelection = false;
          const currentIndex = this.state.graphIndex;
          const currentGraph = this.state.causalGraph.graphHistory[currentIndex].graph;
          var indexToFeatureMap = this.getNodeIndexToFeatureMap(currentGraph);
          this.state.indexToFeatureMap = indexToFeatureMap;
          var markovBlanketFeatureNames = this.getMarkovBlanketFeatureNames(indexToFeatureMap, currentGraph[this.props.targetName]);
          this.state.markovBlanketFeatureNames = markovBlanketFeatureNames;

          var rankData = this.initializeRankData();

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
          this.getInitialConsistencyScores(featuresWithBoundary, xScaleInfo, rankData);

          //var allFeatureNames = this.getInitialConsistencyScores(featuresWithBoundary);



          /*this.setState({
              rankData: rankData,
              isNewTrial: false,
              featureSelectionHistory: [{
                  xScaleDomain: xScaleInfo.xScaleDomain,
                  xScale: xScaleInfo.xScale,
                  features: featuresWithBoundary,
                  coveredFeatures: this.state.markovBlanketFeatureNames,
                  selectedFeatureNames: allFeatureNames,
                  featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500]
              }],
              selectedFeatureSelection: 0,
              MBCurrent: 1,
              activeTabIndex: 2,
              shouldInitializeSelection: false
          }); */

          //this.classify()
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
        var xScale = that.state.featureSelectionHistory[that.state.featureSelectionHistory.length - 1].xScale;
        d3.selectAll('.feature-parallels').select(stringId).attr('transform', function(d) { return 'translate(' + xScale(attrId) + ")" });
        this.state.dragging[attrId] = d3.event.x;
        var currentFeatures = this.state.featureSelectionHistory[this.state.featureSelectionHistory.length - 1].features;
        var oldFeatureNames = currentFeatures.map((feature) =>
            feature.name
        );
        var features = currentFeatures;
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

            var xScaleInfo = this.calculateFeatureSelectionXScale(features);

            this.calculateScores({ features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: this.state.featureRank });
            let coveredFeatures = this.calculateCoverage(allFeatureNames);
            let MBScore = coveredFeatures.size/this.state.markovBlanketFeatureNames.size;

            if (this.state.isNewTrial) {
                this.state.featureSelectionHistory.push({
                    xScale: xScaleInfo.xScale,
                    xScaleDomain: xScaleInfo.xScaleDomain,
                    features: features,
                    coveredFeatures: coveredFeatures,
                    selectedFeatureNames: allFeatureNames,
                    featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500],
                });
            } else {
                this.state.featureSelectionHistory.splice(this.state.featureSelectionHistory.length-1, 1,
                    {
                        xScale: xScaleInfo.xScale,
                        xScaleDomain: xScaleInfo.xScaleDomain,
                        features: features,
                        coveredFeatures: coveredFeatures,
                        selectedFeatureNames: allFeatureNames,
                        featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500],
                    }
                );
            }

            this.setState({
                isNewTrial: false,
                selectedFeatureSelection: this.state.featureSelectionHistory.length - 1,
                MBCurrent: MBScore,
            });
        }
    }

    goFromSelectionToGraph() {
      this.setState({
          activeTabIndex: 1
      })
    }

  classify() {
    if (this.state.MICurrent >= 0) {
      var currentFeatures = this.state.featureSelectionHistory[this.state.featureSelectionHistory.length - 1].features;

      var allFeatureNames = currentFeatures.map((feature) =>
        feature.name
      );
      const stopIndex = allFeatureNames.indexOf("BOUNDARY");
      allFeatureNames.splice(stopIndex);
      const features = { "features": allFeatureNames , "featureRank" : this.state.featureRank};
      fetch('/classify', {
        method: 'POST',
        body: JSON.stringify(features)
      }).then(function(response) {
        return response.json();
      }).then(data => {
        console.log(data);
	this.state.MI.push(this.state.MICurrent);
        this.state.MB.push(this.state.MBCurrent);
        this.state.rocCurve.push(data.rocCurve);
        this.state.auc.push(data.auc);
        this.state.rankLoss.push(this.state.rankLossCurrent);
        this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)));
        this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)));
        this.state.metrics.accuracyTrain.push(parseFloat(data.accuracyTrain.toFixed(3)));
        this.state.confusionMatrixNormalized.push(data.confusionMatrixNormalized);
        this.state.confusionMatrix.push(data.confusionMatrix);
        this.state.trials.push("trial " + String(this.state.metrics.accuracy.length - 1) );

        let lastFeatureSelection = this.state.featureSelectionHistory[this.state.featureSelectionHistory.length - 1];

        /*_LTracker.push({
            'eventName': 'classify results',
            'type': 'remove node',
            'userId': userID,
            'MI': this.state.MICurrent,
            'MB': this.state.MBCurrent,
            'rankLoss': this.state.rankLossCurrent,
            'accuracy': +data.accuracy.toFixed(3),
            'precision': +data.precision.toFixed(3),
            'selectedFeatures': allFeatureNames,
            'coveredFeatures': Array.from(lastFeatureSelection.coveredFeatures)
        })*/


        this.setState({
          rocCurve: this.state.rocCurve,
          isNewTrial: true,
          selectedFeatureSelection: this.state.featureSelectionHistory.length - 1,
          MI: this.state.MI,
          MB: this.state.MB,
          MICurrent: -1,
          MBCurrent: -1,
          metrics: {
            precision: this.state.metrics.precision,
            accuracy: this.state.metrics.accuracy,
            accuracyTrain: this.state.metrics.accuracyTrain
          },
          rankLoss: this.state.rankLoss,
          rankLossCurrent: -1,
          activeTabIndex: 3,
          selectedTrial1: (this.state.metrics.accuracy.length == 1) ? 0 : this.state.metrics.accuracy.length - 2,
          selectedTrial2: (this.state.metrics.accuracy.length == 1) ? -1 : this.state.metrics.accuracy.length - 1
        })
      }).catch(function(error) {
        console.log(error)
      })
    } else {
        this.setState({
            activeTabIndex: 3
        })
    }
  }

  changeDisplaySelection(event) {
      //console.log(event);
      let selectedSelection = event.target.value;
      this.setState({
          selectedFeatureSelection: selectedSelection
      })
  }



  position(d) {
    var value = this.state.dragging[d];
      var currentXScale = this.state.featureSelectionHistory[this.state.featureSelectionHistory.length - 1].xScale;
    var a = value == null ? currentXScale(d) : value;
    //console.log(a)
    return value == null ? currentXScale(d) : value;
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
          if (this.state.MB.length >= 2 && this.state.MBCurrent == -1) {
              axisLength = axisLength + 1;
          }

          this.setState({
            MICurrent: parseFloat(data.MI.toFixed(3)),
            rankLossCurrent: parseFloat(data.rankLoss.toFixed(3)),
            xAxisLength: axisLength
          })

      }).catch(function(error) {
          console.log(error)
      });
  }

  calculateCoverage(selectedFeatures) {
    // start with the nodes directly linked to class node
      var graph = this.state.causalGraph.graphHistory[this.state.graphIndex].graph;
      var selectedFeatureIndexes = [];
      var coveredNodeIndexes = new Set();
      selectedFeatures.map(feature => {
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

  handleClassSelection(className, currentDisplay){
      var classDisplay = this.state.classDisplay;
      classDisplay[className].TP.display = !currentDisplay;
      var recordClassDisplay = {};
      Object.keys(classDisplay).map(key =>
        recordClassDisplay[key] = classDisplay[key].TP.display
      );
      _LTracker.push({ 
          'eventName': 'filter class display',
          'classDisplay': recordClassDisplay
      });

      this.setState({
          classDisplay: classDisplay
      })
  }

  getInitialConsistencyScores(features, xScaleInfo, rankData) {
      var allFeatureIndexes = features.map((feature) =>
          feature.index
      );
      var allFeatureNames = features.map((feature) =>
          feature.name
      );
      const stopIndex = allFeatureIndexes.indexOf(features.length - 1);
      allFeatureIndexes.splice(stopIndex);
      allFeatureNames.splice(stopIndex);

      fetch("/calculateScoresAndClassify", {
          method: 'POST',
          body: JSON.stringify( {features: allFeatureIndexes, names: allFeatureNames, featureRank: this.state.featureRank } )
      }).then(function(response) {
          return response.json();
      }).then(data => {
        this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)));
        this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)));
        this.state.metrics.accuracyTrain.push(parseFloat(data.accuracyTrain.toFixed(3)));
        this.state.confusionMatrixNormalized.push(data.confusionMatrixNormalized);
        this.state.confusionMatrix.push(data.confusionMatrix);
        this.state.trials.push("trial " + String(this.state.metrics.accuracy.length - 1));

        this.setState({
            MI: [parseFloat(data.MI.toFixed(3))],
            rankLoss: [parseFloat(data.rankLoss.toFixed(3))],
            MB: [1.0],
            MICurrent: -1,
            MBCurrent: -1,
            rankLossCurrent: -1,
            rankData: rankData,
            isNewTrial: true,
            featureSelectionHistory: [{
                xScaleDomain: xScaleInfo.xScaleDomain,
                xScale: xScaleInfo.xScale,
                features: features,
                coveredFeatures: this.state.markovBlanketFeatureNames,
                selectedFeatureNames: allFeatureNames,
                featureCoordinatesSize: [xScaleInfo.featureSelectionTotalWidth, 500]
            }],
            selectedFeatureSelection: 0,
            selectedTrial1: (this.state.metrics.accuracy.length == 1) ? 0 : this.state.metrics.accuracy.length - 2,
            selectedTrial2: (this.state.metrics.accuracy.length == 1) ? -1 : this.state.metrics.accuracy.length - 1,
            activeTabIndex: 2,
            shouldInitializeSelection: false,
            rocCurve: [data.rocCurve],
            auc: [data.auc]
        });
      }).catch(function(error) {
        console.log(error)
      })
      //this.calculateScores({ features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: this.state.featureRank });
      //return allFeatureNames;
  }



  updateNumRanks(numRanks) {
      this.state.numRanks = numRanks;
  }

  initializeRankData() {
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
              rankData[featureNameToRankMap[name]].MB.push(name);
          } else {
              rankData[featureNameToRankMap[name]].NotMB.push(name);
          }
      });
      return rankData;
  }

  /* OTHER */
    toggleAnalysis() {
      var selectedFeatures = this.state.featureSelectionHistory[this.state.selectedFeatureSelection].selectedFeatureNames;
      var MBCurrent = this.state.MBCurrent;
      var MICurrent = this.state.MICurrent;
      var rankLossCurrent = this.state.rankLossCurrent;

      _LTracker.push({ 
        'eventName': 'view metrics' ,
        'user': userID,
        'selectedFeatures': selectedFeatures,
        'MB': MBCurrent,
        'MI': MICurrent,
        'rankLoss': rankLossCurrent
        });
      
        this.setState({
            showAnalysis: !this.state.showAnalysis
        })
    }

    goFromAnalysisToSelection() {
        this.setState({
            activeTabIndex: 2
        })
    }

    changeDisplayTrial(event) {
        var trialStr = event.target.value;
        var classifierNum = parseInt(trialStr.substring(0,1));
        var trialNum = parseInt(trialStr.substring(1));
        //console.log(trialNum)
        if (classifierNum == 1) {


          _LTracker.push({
            'eventName': 'compare_classifier', 
            'user': userID,
            'trial1': trialNum,
            'trial1Features': this.state.featureSelectionHistory[trialNum].selectedFeatureNames,
            'trial2': this.state.selectedTrial2,
            'accuracy1': this.state.metrics.accuracy[trialNum],
            'accuracy2': this.state.metrics.accuracy[this.state.selectedTrial2],
            'trial2Features': this.state.featureSelectionHistory[this.state.selectedTrial2].selectedFeatureNames
          });
            this.setState({
                selectedTrial1: trialNum
            })
        } else {
          _LTracker.push({ 
            'eventName': 'compare_classifier', 
            user: userID,
            trial1: trialNum,
            trial1Features: this.state.featureSelectionHistory[trialNum].selectedFeatureNames,
            trial2: this.state.selectedTrial2,
            accuracy1: this.state.metrics.accuracy[trialNum],
            accuracy2: this.state.metrics.accuracy[this.state.selectedTrial2],
            trial2Features: this.state.featureSelectionHistory[this.state.selectedTrial2].selectedFeatureNames
          });
            this.setState({
                selectedTrial2: trialNum
            })
        }
    }

    changeROCClassDisplay(label, display) {
      var classDisplay = this.state.ROCDisplayClass;
      classDisplay[label].TP.display = !display;
      this.setState({
        ROCDisplayClass: classDisplay
      });
    }

    download() {
        console.log("download");
        let fileName = 'featureSelection.txt';
        let content = this.state.metrics.accuracy;
        var a = document.getElementById("a");
        let file = new Blob([content], {type: 'text/plain'});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        //a.click();
    }

  render() {
    // set graph max for consistency graph
    console.log(this.state.selectedTrial2)
    var metricsGraphMax = Math.max(this.state.consistencyGraphLegendMax, this.state.MICurrent);
    this.state.consistencyGraphLegendMax = metricsGraphMax;

    var rankLossMax = this.state.rankLossCurrent;
    rankLossMax = Math.max(rankLossMax, Math.max.apply(null, this.state.rankLoss)) + 1; // TODO: when rankloss is 0

    var currentGraphHistory;
    if (this.state.graphIndex >= 0) {
        currentGraphHistory = this.state.causalGraph.graphHistory[this.state.graphIndex];
    } else {
        currentGraphHistory = {graph: {}, dotSrc: ""}
    }

    var SBLegend = [
        { value: "Selected", color: "#64ab23", helptext: "feature in selected feature set" },
        { value: 'Not Selected', color: '#a9a9a9', helptext: "feature not in selected feature set" },
        { value: "In MB", color: "#7e6699", helptext: "in the markov blanket of the target node in the causal graph" },
        { value: 'Not in MB', color: '#f08036', helptext: "not in the markov blanket of the target node in the causal graph" }
    ];

    for (var i = this.state.featureImportance.circleRadii.length - 1; i >= 0 ; i--) {
        if (i == this.state.featureImportance.circleRadii.length - 1) {
            SBLegend.push({value: "Most Important", color: this.state.FIcolorFunction(i), helptext: "feature indicted as most important to predict target"})
        } else if (i == 0) {
            SBLegend.push({ value: "Least Important", color: this.state.FIcolorFunction(i), helptext: "feature indicted as least important to predict target" })
        } else {
            SBLegend.push({ value: "", color: this.state.FIcolorFunction(i), helptext: "" })
        }
    }

    SBLegend.push({ value: "No Importance", color: "white", helptext: "feature indicted as not important to predict target"});

    var selectedFeatureSelection;
    if (this.state.selectedFeatureSelection >= 0) {
      selectedFeatureSelection = this.state.featureSelectionHistory[this.state.selectedFeatureSelection];
    } else {
        selectedFeatureSelection = { features: null, xScale: null, xScaleDomain: null, coveredFeatures: new Set(), selectedFeatureNames: [], featureCoordinatesSize:[1200,500] };
    }

    var trialLegend = (this.state.selectedTrial2 >= 0) ? [this.state.selectedTrial1, this.state.selectedTrial2] : [this.state.selectedTrial1];
    var rocCurveTwo = (this.state.selectedTrial2 >= 0) ? this.state.rocCurve[this.state.selectedTrial2] : {};
    var featuregraph;
    if (selectedFeatureSelection.features != null) {
      featuregraph = <FeatureParallelCoordinates
          data={this.state.featureData.inputData}
          convertedData={this.state.featureData.convertedData}
          features={selectedFeatureSelection.features}
          xScaleDomain={selectedFeatureSelection.xScaleDomain}
          xScale={selectedFeatureSelection.xScale}
          dragging={this.state.dragging}
          featureAxisOnEnd={this.featureAxisOnEnd}
          size={selectedFeatureSelection.featureCoordinatesSize}
          sendData={this.sendData}
          colorFunction={this.state.colorFunction}
          classDisplay={this.state.classDisplay}
          nameToIndexMap={this.state.nameToIndexMap}
      />
    } else {
      featuregraph = <div></div>
    }
      return (
        <div className={'root-div'}>
            <SideBar featureInfo={this.props.description} show={this.state.showInfo} close={() => this.showInfoFalse()}/>

            <button className={"sidebar-toggle"} onClick={this.showInfoTrue}>{"☰"}</button>
            <div className={'help-icon-tooltip'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>                <span className={"tooltip-text"}>
                    {this.state.helptext[this.state.activeTabIndex]}
                </span>
            </div>

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
                    colorFunction={this.state.FIcolorFunction}
                />
              </Tab>
                <Tab linkClassName={"Causal Graph"}>
                  <CausalGraph
                      datasetName={this.state.datasetName}
                      dotSrc={currentGraphHistory.dotSrc}
                      sendData={this.sendData}
                      graph={currentGraphHistory.graph}
                      targetName={this.props.targetName}
                      undo={(n) => this.removeLastGraph(n)}
                      clearGraph={this.clearGraph}
                      nextStep={this.sendGraphToSelection}
                      prevStep={this.goFromGraphToImportance}
                      getGraphDataToLog={this.getGraphDataToLog}
                  />
              </Tab>

              <Tab linkClassName={"Feature Selection"}>
                  <div>
                      <div className={"tools-bar"}>
                          <button className={"tools-bar action-button"} style={{background: "royalblue"}} onClick={this.toggleAnalysis}>
                              { this.state.showAnalysis ? "Display Features" : " Show Analysis of Feature Set" }
                          </button>
                          <div className={"tools-bar-help"}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              <span className={"tools-bar-help-text"}>
                                {"Analysis of how the current selected feature set relates to features importance and causal graph"}
                                </span>
                          </div>
                          <button className={"tools-bar right-button next-button"} onClick={this.classify}>{"CREATE CLASSIFER »"}</button>
                          <button className={"tools-bar right-button previous-button"} onClick={this.goFromSelectionToGraph}>{"« PREVIOUS"}</button>
                      </div>
                      <div>
                          <span>Feature Selection for: </span>
                          <select onChange={ this.changeDisplaySelection } >
                              {this.state.featureSelectionHistory.map((history, index) =>
                                  <option selected={(index == this.state.selectedFeatureSelection) ? "selected": "" } value={index}>{`trial ${index}`}</option>
                              )}
                          </select>
                      </div>
                      {featuregraph}
                      <div style={{display: this.state.showAnalysis? "none" : "block"}}>

                          <div className={"className-legend-title"}>{`Displayed ${this.props.targetName}`}</div>
                          <Legend className={"legend legend-left class-legend"}
                                  keys={this.props.classNames}
                                  colors={this.state.colorRange}/>
                      <CheckboxMultiSelect options={this.state.classDisplay}
                                           handleChange={(c, d) => this.handleClassSelection(c, d)}/>
                      </div>
                      <div className={""} style={{display: this.state.showAnalysis? "grid" : "none"}}>
                          <div className={"confusion-matrix-title"} style={{marginLeft: "350px", marginBottom: "20px"}}>Consistency with Causal Graph</div>
                          <div className={"grid-container"}>
                              <div className={"grid-item"}>
                                  <VerticalLegend style={{marginLeft : "20px"}} legend={this.state.consistencyGraphLegend} width={170}/>
                                  <ProgressGraph size={[500, 300]}
                                                 yAxisLabel={"MB Consistency/Mutual Information"}
                                                 max={this.state.consistencyGraphLegendMax}
                                                 min={0}
                                                 name={"consistency"}
                                                 scores={{
                                                     MB: (this.state.MBCurrent >= 0) ? this.state.MB.concat([this.state.MBCurrent]) : this.state.MB ,
                                                     MI: (this.state.MICurrent >= 0) ? this.state.MI.concat([this.state.MICurrent]) : this.state.MI }}
                                                 colors={this.state.consistencyGraphLegend.map((item) => item.color)}
                                                 xAxisLength={this.state.xAxisLength}
                                  />
                              </div>

                              <div className={"grid-item"}>
                                  <VerticalLegend marginLeft={"0px"}
                                      legend={[
                                      { value: "Covered", color: "#b9d9ff", helptext: "Either a selected feature or there is a subset of selected features that make up a path to/from this feature" },
                                      { value: 'Not Covered', color: '#a9a9a9', helptext: "Not a selected feature and no subset of selected features make up a path to/from this feature" }
                                  ]} width={120}/>
                              </div>
                              <div className={"grid-item"}>
                                  <PieChart size={[400,300]}
                                            data={Array.from(this.state.markovBlanketFeatureNames)}
                                            selection={Array.from(selectedFeatureSelection.coveredFeatures)}
                                  />
                              </div>
                        </div>

                          <div className={"confusion-matrix-title"} style={{marginLeft: "350px", marginBottom: "20px"}}>Consistency with Feature Importance

                          </div>

                          <div className={"grid-container"}>
                          <div className={"grid-item"}>
                              <VerticalLegend style={{marginLeft : "20"}} legend={this.state.rankLossGraphLegend} width={100}/>
                              <ProgressGraph size={[500, 300]}
                                             yAxisLabel={"rank loss"}
                                             max={rankLossMax}
                                             min={0}
                                             name={"rankLoss"}
                                             scores={{ rankloss: this.state.rankLossCurrent >= 0 ? this.state.rankLoss.concat([this.state.rankLossCurrent]) : this.state.rankLoss}}
                                             colors={this.state.rankLossGraphLegend.map((item) => item.color)}
                                             xAxisLength={this.state.xAxisLength}
                              />
                          </div>

                          <div className={"grid-item"}>
                              <VerticalLegend marginLeft={"0px"} legend={SBLegend} width={150}/>
                          </div>
                          <div className={"grid-item"}>
                              <SunburstChart size={[400,300]}
                                             data={this.state.rankData}
                                             selection={selectedFeatureSelection.selectedFeatureNames}
                                             numImportance={this.state.featureImportance.circleRadii.length}
                                             colorFunction={this.state.FIcolorFunction}
                              />
                          </div>
                        </div>
                      </div>
                  </div>
              </Tab>
              <Tab linkClassName={"Performance Analysis"}>
                  <div className={"tools-bar"}>
                      <button className={"tools-bar right-button previous-button"} onClick={this.goFromAnalysisToSelection}>{"« PREVIOUS"}</button>
                  </div>
                  <div className={"confusion-matrix-container"}>
                      <div className={"confusion-matrix-title"}>Confusion Matrix</div>
                      <CompareClassifiers changeTrial={ this.changeDisplayTrial }
                                          trials={ this.state.trials }
                                          selectedTrial1={ this.state.selectedTrial1 }
                                          selectedTrial2={ this.state.selectedTrial2 }
                                          confusionMatrices={ this.state.confusionMatrix }
                                          confusionMatricesNormalized={ this.state.confusionMatrixNormalized }
                                          classNames={this.props.classNames}/>
                  </div>
                  <div className={"confusion-matrix-title"} style={{marginLeft: "445px", marginBottom: "10px", marginTop: "20px"}}> {"ROC Curve"}</div>
                  <div className={"grid-ROC"}>
                      <RocCurve size={[400, 300]}
                                name={"one"}
                                rocCurve={(this.state.rocCurve.length > 0) ? this.state.rocCurve[this.state.selectedTrial1] : {}}
                                rocCurveTwo={ (rocCurveTwo !== undefined) ? rocCurveTwo : {} }
                                colors={this.state.colorFunction}
                                displayClass={this.state.ROCDisplayClass}
                                />
                      <Legend className={"legend legend-left class-legend legendMargin"}
                              keys={this.props.classNames}
                              colors={this.state.colorRange}/>
                      <CheckboxMultiSelect options={this.state.ROCDisplayClass}
                                           handleChange={(c, d) => this.changeROCClassDisplay(c, d)}/>

                       <div className={"legend legend-left"}>
                           {trialLegend.map((item, index) =>
                               <div style={{padding: "1px", width: 100, marginLeft: "450px"}}>
                                   <div className={`roc-legend-marker ${(index == 0) ? "first-marker" : "second-marker"}`}
                                        style={{background: "white"}}></div>
                                   <p>{"trial " + item}</p>
                               </div>
                           )}
                       </div>
                  </div>
                  <div className={"confusion-matrix-title"} style={{marginLeft: "445px", marginBottom: "10px", marginTop: "20px"}}> Statistical Metrics</div>
                  <div style={{textAlign: "center"}} >
                      <ProgressGraph size={[500, 300]}
                                     yAxisLabel={"Accuracy"}
                                     max={1}
                                     min={0}
                                     name={"accuracy-graph"}
                                     scores={{ accuracy: this.state.metrics.accuracy, accuracyTrain: this.state.metrics.accuracyTrain }}
                                     colors={[this.state.metricsGraphLegend[0].color, this.state.metricsGraphLegend[1].color]}
                                     xAxisLength={this.state.xAxisLength} />
                      <VerticalLegend legend={this.state.metricsGraphLegend} width={130}  marginLeft={"450px"}/>
                  </div>

              </Tab>
          </Tabs>
        </div>
      )
  }
}

/*
<svg className={'matrix-icon'} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              <span className={"tools-bar-help-text"} style={{float: "none"}}>
                                {""}
                              </span>

 <svg className={'matrix-icon'} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              <span className={"tools-bar-help-text"} style={{float: "none"}}>
                                {""}
                              </span>
                       <BarGraph size={[500,300]} metrics={this.state.metrics} colors={this.state.metricsGraphLegend.map((item) => item.color)} xAxisLength={this.state.xAxisLength}/>

 */
