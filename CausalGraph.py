import pydot
import numpy as np
from pycausal.pycausal import pycausal as pc
from pycausal import prior as pr
from pycausal import search as s
import pandas as pd
import copy

class CausalGraph:
    #def __init__(self, df, dot_src, edges, nodes, class_node_str):
    def __init__(self, df, forbidden_edges, required_edges, class_node_str):
        self.class_node_str = class_node_str
        self.edge_to_dot_src_line_offset = 1
        self.markov_blanket_selected = True
        self.selected_node = None
        self.selected_edge = None
        self.df = df
        self.removed_nodes = []
        self.init_dataframe(df)
        self.init_causal_graph_dot_src(self.df, forbidden_edges, required_edges)

        self.forbidden_edges = forbidden_edges
        self.required_edges = required_edges
        self.graph_history = []
        # METHOD TO CONVERT DOT SRC TO MARKOV BLANKET
        #self.edges_to_graph_dict()
        #self.init_spouse_graph()
        #
        self.get_markov_blanket_nodes_from_edges()
        self.generate_subgraph_dot_src_and_graph()
        #self.find_paths_from_class_node_helper('Humidity')

        self.find_paths_to_class_node()
        self.find_paths_from_class_node()
        self.get_markov_blanket_nodes_indexes()
        #self.calculate_MB_consistency_score2(list(self.class_markov_blanket))
        #self.color_markov_blanket('CLASS')
        #self.color_edges_nodes_to_class_node('AC')

    def init_dataframe(self, df):
        #df = pd.read_csv(datapath)
        self.df = df

    def recalculate_causal_graph(self, feature_name_array, removed_edges):
        print removed_edges
        for feature_name in feature_name_array:
            self.removed_nodes.append(feature_name)
        df = self.df.drop(self.removed_nodes, axis=1)
        required_edges = []
        for node in self.removed_nodes:
            for i, edge in enumerate(self.required_edges):
                if node == edge[0] or node == edge[1]:
                    pass
                else:
                    required_edges.append(edge)

        #self.init_causal_graph_dot_src(dot_src, edges, nodes)
        #self.edges_to_graph_dict()
        #self.init_spouse_graph()

        self.init_causal_graph_dot_src(df, self.forbidden_edges, required_edges)
        for node in self.removed_nodes:
            self.nodes.append(node)
        self.remove_all_edges_from_edge_array(removed_edges)
        self.get_markov_blanket_nodes_from_edges()
        self.generate_subgraph_dot_src_and_graph()
        #self.add_removed_node_to_dotlines(self.removed_nodes)
        #self.add_nodes_to_graph_dict(self.removed_nodes)
        self.find_paths_to_class_node()
        self.find_paths_from_class_node()
        self.get_markov_blanket_nodes_indexes()
        #self.remove_edges_from_dot_lines_and_graph(removed_edges)
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.graph_history.append({'edges': copy.copy(self.edges), 'dot_src': copy.copy(self.dot_src)})

    def undo_last_edit(self, editInfo):
        if editInfo['type'] == 'addEdge': # undo add edge
            self.remove_edge_from_edge_array(editInfo['data'][0], editInfo['data'][1]) # remove edge from self.edges
        elif editInfo['type'] == 'removeEdge':# undo edge removal
            new_edge = editInfo['data'][0] + ' -> ' + editInfo['data'][1]
            self.edges.append(new_edge)
        else: # undo node removal
            self.remove_node_from_removed_nodes(editInfo['data'][0])
            last_graph = self.graph_history.pop()
            self.edges = last_graph['edges']
            print self.edges
            self.dot_src = last_graph['dot_src']

    def remove_node_from_removed_nodes(self, node):
        for i, removed_node in enumerate(self.removed_nodes):
            if node == removed_node:
                del self.removed_nodes[i]

    def clear_removed_node(self):
        self.removed_nodes = []

    def remove_edges_from_dot_lines_and_graph(self, removed_edges):
        for edge in removed_edges:
            node_from_str = edge[0]
            node_to_str = edge[1]
            if node_to_str in self.graph[node_from_str]['edgeTo'].keys():
                index = self.map_edge_index_to_line_index[self.graph[node_from_str]['edgeTo'][node_to_str]]
                self.dot_src_lines[index] = ""
                self.graph[node_from_str]['edgeTo'].pop(node_to_str, None)
                node_from_index = self.graph[node_from_str]['nodeIndex']
                node_to_index = self.graph[node_to_str]['nodeIndex']
                for i, value in enumerate(self.graph[node_from_str]['nodeTo']):
                    if value == node_to_index:
                        del self.graph[node_from_str]['nodeTo'][i]
                for j, value in enumerate(self.graph[node_to_str]['nodeFrom']):
                    if value == node_from_index:
                        del self.graph[node_to_str]['nodeFrom'][i]
                        del self.graph[node_to_str]['edgeFrom'][i]


    def remove_edge_from_graph(self, edgeFrom, edgeTo):
        self.remove_edge_from_edge_array(edgeFrom, edgeTo)
        self.get_markov_blanket_nodes_from_edges()
        self.generate_subgraph_dot_src_and_graph()
        self.find_paths_to_class_node()
        self.find_paths_from_class_node()
        self.get_markov_blanket_nodes_indexes()

    def remove_all_edges_from_edge_array(self, edges_to_remove):
        for edge in edges_to_remove:
            edgeFrom = edge[0]
            edgeTo = edge[1]
            self.remove_edge_from_edge_array(edgeFrom, edgeTo)

    def remove_edge_from_edge_array(self, edgeFrom, edgeTo):
        for edge in self.edges:
            edgeInfo = edge.split(" ")
            #print str(edgeInfo[0]) == edgeFrom and str(edgeInfo[1]) == edgeTo
            if edgeInfo[0] == edgeFrom and edgeInfo[2] == edgeTo:
                self.edges.remove(edge)
                break

    def add_edge(self, node_from, node_to):
        new_edge = node_from + ' -> ' + node_to
        self.edges.append(new_edge)
        self.get_markov_blanket_nodes_from_edges()
        self.generate_subgraph_dot_src_and_graph()
        self.find_paths_to_class_node()
        self.find_paths_from_class_node()
        self.get_markov_blanket_nodes_indexes()

    def add_nodes_to_graph_dict(self, feature_name_array):
        for feature_name in feature_name_array:
            self.create_node_dict(feature_name, self.node_index)
            self.node_index += 1
            self.graph[feature_name]['paths'] = []
            self.graph[feature_name]['pathNodes'] = []
            self.graph[feature_name]['pathsFrom'] = []
            self.graph[feature_name]['pathNodesFrom'] = []

    def add_removed_node_to_dotlines(self, feature_name_array):
        for feature_name in feature_name_array:
            self.dot_src_lines.insert(len(self.dot_src_lines) - 1, feature_name)

    #def init_causal_graph_dot_src(self, dot_src, edges, nodes):
    def init_causal_graph_dot_src(self, df, forbidden_edges, required_edges):
        p = pc()
        p.start_vm()
        tetrad = s.tetradrunner()
        #print("forbidden_edges:" + str(forbidden_edges))
        #print("required_edges:" + str(required_edges))
        prior = pr.knowledge(forbiddirect = forbidden_edges, requiredirect = required_edges)
        tetrad.run(algoId = 'fges', dfs = df, priorKnowledge = prior, scoreId = 'sem-bic', dataType = 'continuous', penaltyDiscount = 2, maxDegree = -1, faithfulnessAssumed = True, verbose = True)
        dot_src = p.tetradGraphToDot(tetrad.getTetradGraph())
        p.stop_vm()
        self.edges = tetrad.getEdges()
        self.nodes = tetrad.getNodes()
        dot_src = self.trim_init_src_string(dot_src)
        self.dot_src_lines = self.dot_src_to_lines(dot_src)
        #self.edges = edges
        #self.nodes = nodes
        #self.insert_node_attr_dot_src()
        #self.insert_class_node_color()
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.init_dot_src = self.dot_src
        self.uncolored_dot_src = self.init_dot_src


    def get_markov_blanket_nodes_from_edges(self):
        self.markov_blanket_node_names = set()
        children = set()
        for edge in self.edges:
            edgeInfo = edge.split(" ")
            from_node = str(edgeInfo[0])
            to_node = str(edgeInfo[2])
            if (from_node == self.class_node_str):
                children.add(to_node)
                self.markov_blanket_node_names.add(to_node)
            if (to_node == self.class_node_str):
                self.markov_blanket_node_names.add(from_node)
        for edge in self.edges:
            edgeInfo = edge.split(" ")
            from_node = str(edgeInfo[0])
            to_node = str(edgeInfo[2])
            if (to_node in children):
                self.markov_blanket_node_names.add(from_node)
        #print self.markov_blanket_node_names
        #self.markov_blanket_node_names = list

    #def insert_class_node_color(self):
    #    self.add_color_node_to_end_src_lines(self.class_node_str, self.class_node_color)
        #elf.dot_src_lines.insert(len(self.dot_src_lines)-1, self.class_node_str + "[color=" + self.class_node_color + "]")

    def dot_src_to_lines(self, dot_src):
        return dot_src.splitlines()

    def lines_to_dot_src(self, lines):
        return "\n".join(lines)

    def create_node_dict(self, node_name, node_index):
        self.graph[node_name] = dict()
        self.graph[node_name]['edgeTo'] = dict()
        self.graph[node_name]['nodeIndex'] = node_index
        self.node_index_to_name_map[node_index] = node_name
        self.graph[node_name]['edgeFrom'] = []
        self.graph[node_name]['nodeFrom'] = []
        self.graph[node_name]['nodeTo'] = []
        self.graph[node_name]['spouseEdge'] = []
        self.graph[node_name]['spouseNode'] = []
        self.graph[node_name]['paths'] = set()
        self.graph[node_name]['pathNodes'] = set()
        self.graph[node_name]['pathsFrom'] = set()
        self.graph[node_name]['pathNodesFrom'] = set()
        self.graph[node_name]['visited'] = False

    def edges_to_graph_dict(self):
        self.graph = dict()
        self.node_index_to_name_map = dict()
        #for node in self.nodes:
        #    self.graph[str(node)] = dict()
        self.node_index = 1
        self.edge_index = 0
        for index, edge in enumerate(self.edges):
            self.edge_index = index + self.edge_to_dot_src_line_offset
            edgeInfo = edge.split(" ")
            fromNode = str(edgeInfo[0])
            toNode = str(edgeInfo[2])
            if fromNode not in self.graph.keys():
                self.create_node_dict(fromNode, self.node_index)
                self.node_index += 1
            if toNode not in self.graph.keys():
                self.create_node_dict(toNode, self.node_index)
                self.node_index += 1
            self.graph[fromNode]['edgeTo'][toNode] = self.edge_index
            self.graph[toNode]['edgeFrom'].append(self.edge_index)
            self.graph[toNode]['nodeFrom'].append(self.graph[fromNode]['nodeIndex'])
            self.graph[fromNode]['nodeTo'].append(self.graph[toNode]['nodeIndex'])

    def edges_to_graph_dict_subgraph(self, edges, line_index):
        for index, edge in enumerate(edges):
            edgeInfo = edge.split(" ")
            # print edgeInfo
            fromNode = str(edgeInfo[0])
            toNode = str(edgeInfo[2])
            if fromNode not in self.graph.keys():
                self.create_node_dict(fromNode, self.node_index)
                self.node_index += 1
            if toNode not in self.graph.keys():
                self.create_node_dict(toNode, self.node_index)
                self.node_index += 1
            self.graph[fromNode]['edgeTo'][toNode] = self.edge_index
            self.graph[toNode]['edgeFrom'].append(self.edge_index)
            self.map_edge_index_to_line_index[self.edge_index] = line_index
            self.graph[toNode]['nodeFrom'].append(self.graph[fromNode]['nodeIndex'])
            self.graph[fromNode]['nodeTo'].append(self.graph[toNode]['nodeIndex'])
            self.edge_index += 1
            line_index += 1
        return line_index

    def generate_subgraph_dot_src_and_graph(self):
        graphs = self.get_subgraph_edges()
        nodes_with_edges = graphs[2]
        node_wo_edges = []
        for node in self.nodes:
            if node not in nodes_with_edges:
                node_wo_edges.append(node)
        self.generate_graph_from_subgraph(graphs[0], graphs[1], node_wo_edges)
        self.generate_subgraph_dot_src(graphs[0], graphs[1], node_wo_edges)

    def get_subgraph_edges(self):
        nodes_with_edges = []
        markov_blanket_subgraph = []
        #markov_blanket_subgraph_edge_index = []
        other_subgraph = []
        #other_subgraph_edge_index = []
        for index, edge in enumerate(self.edges):
            edgeInfo = edge.split(" ")
            from_node_str = str(edgeInfo[0])
            to_node_str = str(edgeInfo[2])
            nodes_with_edges.append(from_node_str)
            nodes_with_edges.append(to_node_str)

            if ((from_node_str in self.markov_blanket_node_names or from_node_str == self.class_node_str) and (to_node_str in self.markov_blanket_node_names or to_node_str == self.class_node_str)):
                markov_blanket_subgraph.append(from_node_str + " -> " + to_node_str + " ;")
                #markov_blanket_subgraph_edge_index.append(index)
            else:
                other_subgraph.append(from_node_str + " -> " + to_node_str + " ;")
                #other_subgraph_edge_index.append(index)
        return [markov_blanket_subgraph, other_subgraph, nodes_with_edges]

    def generate_subgraph_dot_src(self, markov_blanket_subgraph, other_subgraph, nodes_wo_edges):
        markov_blanket_subgraph.insert(0, "subgraph cluster_0 {")
        markov_blanket_subgraph.append("label = \"Markov Blanket\" ")
        markov_blanket_subgraph.append("}")

        other_subgraph = other_subgraph + nodes_wo_edges
        other_subgraph.insert(0, "subgraph cluster_1 {")
        other_subgraph.append("label = \"Other Variables\" ")
        other_subgraph.append("}")

        subgraphs_dot_src_lines = markov_blanket_subgraph + other_subgraph
        subgraphs_dot_src_lines.insert(0, "digraph G {")
        subgraphs_dot_src_lines.insert(1, "rankdir=TB;")
        subgraphs_dot_src_lines.insert(2, "splines=\"line\"");
        subgraphs_dot_src_lines.append("}")
        self.dot_src_lines = subgraphs_dot_src_lines
        self.dot_src = self.lines_to_dot_src(subgraphs_dot_src_lines)

    def generate_graph_from_subgraph(self, markov_blanket_subgraph, other_subgraph, node_wo_edges):
        self.graph = dict()
        self.node_index_to_name_map = dict()
        self.edge_index = 1
        self.node_index = 1
        self.map_edge_index_to_line_index = dict()
        line_index = self.edges_to_graph_dict_subgraph(markov_blanket_subgraph, 4)
        self.edges_to_graph_dict_subgraph(other_subgraph, line_index + 3)
        self.add_nodes_to_graph_dict(node_wo_edges)
        start_index = 1
        start_index = self.init_spouse_graph(markov_blanket_subgraph, start_index)
        self.init_spouse_graph(other_subgraph, start_index)


    def calculate_MB_consistency_score(self, feature_names):
        # have index and names of nodes in the MB, names of selected set
        # list of uncovered nodes
        MB_nodes = dict()
        for node_index in self.markov_blanket_node_indexes:
            MB_nodes[node_index] = False
        parent_nodes = self.graph[self.class_node_str]['nodeFrom']
        node_indexes = self.graph[self.class_node_str]['spouseNode'] + self.graph[self.class_node_str]['nodeTo']
        found_node_indexes = set() # set of found node indices
        parent_node_indexes = set()
        for node_name in feature_names:
            # parent node covered
            if len(parent_nodes_indexes) < len(parent_nodes): #if not all parent nodes covered:
                common_nodes = list(set(parent_nodes) & set(self.graph[node_name]['pathNodes']))
                for common_node in common_nodes:
                    MB_nodes[common_node] = True
                    parent_node_indexes.add(common_node)#add common node to set of found parent nodes
            # spouse and child node covered
            if len(found_node_indexes) < len(node_indexes):#not all nodes covered:
                self.has_path_to_spouse(node_name, node_indexes, found_node_indexes)
            if len(found_node_indexes) == len(node_indexes) and len(parent_nodes_indexes) == len(parent_nodes):
                break
        score = self.calculate_consistency_from_coverage(MB_nodes)

    #def calculate_consistency_from_coverage(self, MB_nodes):
    #    value_per_node = 1.0/len(self.markov_blanket_node_indexes)
    #    score = 0.0
    #    for node_index in MB_nodes.keys():
    #        if MB_nodes[node_index] == True:
    #        score += node_value
    #    return score

    def has_path_to_node_indexes(self, feature_name, node_indexes, found_indexes):
        for node_index in self.graph[feature_name].nodeTo:
            if node_index in node_indexes:
                found_indexes.add(node_index)
            else:
                name = self.node_index_to_name_map[node_index]
                self.has_path_to_spouse(name, node_indexes, found_indexes)

    def calculate_MB_consistency_score2(self, feature_names):
        decay_factor = 1
        MB_nodes = dict()
        for node_index in self.markov_blanket_node_indexes:
            MB_nodes[node_index] = -1
        node_indexes = self.markov_blanket_node_indexes
        found_indexes = set()
        for name in feature_names:
            self.calculate_steps_to_node_indexes(name, node_indexes, found_indexes, 1, MB_nodes)
            if len(found_indexes) == len(node_indexes):
                break
        #print MB_nodes
        node_value = 1.0/(len(node_indexes))
        self.score = len(found_indexes) * node_value
        #print score
        #self.decay_score = self.calculate_score_from_coverage(MB_nodes, decay_factor)
        #print decay_score

    def calculate_score_from_coverage(self, MB_nodes, decay_factor):
        score = 0.0
        node_value = 1.0/(len(self.markov_blanket_node_indexes))
        for node_index in MB_nodes.keys():
            if MB_nodes[node_index] > 0:
                score += decay_factor * MB_nodes[node_index] * node_value
            elif MB_nodes[node_index] == 0:
                score += node_value
            else:
                score += 0.0
        return score

        # need to get # of step to the node
    def calculate_steps_to_node_indexes(self, feature_name, node_indexes, found_indexes, step, MB_nodes):
        node_index = self.graph[feature_name]['nodeIndex']
        if node_index in node_indexes:
            MB_nodes[node_index] = 0
            found_indexes.add(node_index)
            return
        for node_index in self.graph[feature_name]['nodeTo']:
            if node_index in node_indexes:
                #print self.node_index_to_name_map[node_index]
                #print step
                found_indexes.add(node_index)
                if MB_nodes[node_index] == -1 or MB_nodes[node_index] > step:
                    MB_nodes[node_index] = step
            else:
                new_step = step + 1
                name = self.node_index_to_name_map[node_index]
                self.calculate_steps_to_node_indexes(name, node_indexes, found_indexes, new_step, MB_nodes)

    def get_markov_blanket_nodes_indexes(self):
        #self.class_markov_blanket = set()
        self.markov_blanket_node_indexes = set()
        #all_node_indexes = [self.graph[self.class_node_str]['nodeFrom'], self.graph[self.class_node_str]['nodeTo'], self.graph[self.class_node_str]['spouseNode']]
        for node_name in self.markov_blanket_node_names:
            self.markov_blanket_node_indexes.add(self.graph[node_name]['nodeIndex'])
            #for node_index in node_indexes:
            #self.graph[self.class_node_str]['nodeFrom']:
                #self.class_markov_blanket.add(self.node_index_to_name_map[node_index])
                #self.markov_blanket_node_indexes.add(node_index)

    def init_spouse_graph(self, edges, start_edge_index):
        for index, edge in enumerate(edges):
            #dot_src_line_index = index + self.edge_to_dot_src_line_offset
            edgeInfo = edge.split(" ")
            fromNode = str(edgeInfo[0]) # medium
            toNode = str(edgeInfo[2]) # LB
            current_edge = start_edge_index#self.graph[toNode]['edgeFrom'][fromNode]
            for i, edge in enumerate(self.graph[toNode]['edgeFrom']): # enumerate the edge from
                if edge != current_edge:
                    node = self.graph[toNode]['nodeFrom'][i] # nodes to the toNode that is no the current from node
                    if node not in self.graph[fromNode]['nodeFrom'] and node not in self.graph[fromNode]['nodeTo']:
                        #print fromNode, node, self.graph[fromNode]['nodeFrom'], self.graph[fromNode]['nodeTo']
                        self.graph[fromNode]['spouseEdge'].append(edge)
                        self.graph[fromNode]['spouseNode'].append(node)
            start_edge_index += 1
        return start_edge_index

        #node_names = self.graph.keys()
        #for i in range(len(node_names)):
        #    for j in range(i, len(node_names)):
        #        children_i = self.graph[node_names[i]].nodeTo
        ##        children_j = self.graph[node_names[j]].nodeTo
        #        common_children = list(set(children_i) & set(children_j))
        #    print self.graph[node_names[i]].spouse
    def init_paths_to_target_node(self):
        for node_str in self.graph.keys():
            self.find_paths_to_class(node_str)

    def find_paths_to_class(self, node_str):
        if self.graph[node_str]['visited'] == False:
            for node_to in self.graph[node_str]['edgeTo'].keys():
                if node_to == self.class_node_str:
                    #print node_str
                    self.graph[node_str]['paths'].append([self.graph[node_str]['edgeTo'][node_to]])
                    #print self.graph[node_str]['paths']
                else:
                    self.find_paths_to_class(node_to)
                    #print self.graph[node_to]['paths']
                    for path in self.graph[node_to]['paths']:
                        new_path = copy.copy(path)
                        new_path.insert(0, self.graph[node_str]['edgeTo'][node_to])
            self.graph[node_str]['visited'] = True


    def set_dot_src_and_lines_to_init(self):
        self.dot_src = self.init_dot_src
        self.dot_src_lines = self.dot_src_to_lines(self.dot_src)

    def set_dot_src_and_lines_to_uncolored_dot_src(self):
        self.dot_src = self.uncolored_dot_src
        self.dot_src_lines = self.dot_src_to_lines(self.dot_src)

    def toggle_markov_blanket_selected(self):
        self.markov_blanket_selected = not self.markov_blanket_selected
        #print self.markov_blanket_selected, self.selected_node
        if self.selected_node != None:
            self.color_graph_select_node(self.selected_node)

    def color_graph_select_node(self, node):
        self.selected_node = node
        self.edge_selected = None
        self.set_dot_src_and_lines_to_uncolored_dot_src()
        self.add_color_node_to_end_src_lines(self.selected_node, self.selected_node_color)
        if self.markov_blanket_selected:
            self.color_markov_blanket(node)
        else:
            self.color_edges_nodes_to_class_node(node)

    def color_edges_nodes_to_class_node(self, start_node):
        paths = self.find_paths_to_class_node(start_node)
        for path in paths:
            self.color_edges_nodes_in_path(path, self.color_to_class)
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)

    def find_paths_to_class_node(self):
        for start_node in self.graph.keys():
            self.graph[start_node]['visited'] = False
            self.graph[start_node]['paths'] = set(self.graph[start_node]['paths'])
            self.graph[start_node]['pathNodes'] = set(self.graph[start_node]['pathNodes'])
        for start_node in self.graph.keys():
            self.find_paths_to_class_node_helper(start_node)
        for start_node in self.graph.keys():
            self.graph[start_node]['paths'] = list(self.graph[start_node]['paths'])
            self.graph[start_node]['pathNodes'] = list(self.graph[start_node]['pathNodes'])

    def find_paths_to_class_node_helper(self, start_node_str):
        if start_node_str == self.class_node_str:
            return True
            #all_paths.append(current_path)
        if self.graph[start_node_str]['visited']:
            #print start_node_str
            return self.graph[start_node_str]['paths']
        for node_str in self.graph[start_node_str]['edgeTo'].keys():
            #updated_path = copy.copy(current_path)
            #updated_path.append(self.graph[start_node_str]['edgeTo'][node_str]) # index of new edge
            #new_step = step + 1
            paths = self.find_paths_to_class_node_helper(node_str)
            #print paths, node_str, start_node_str
            if paths == True:
                self.graph[start_node_str]['paths'].add(self.graph[start_node_str]['edgeTo'][node_str])
                self.graph[start_node_str]['pathNodes'].add(self.graph[node_str]['nodeIndex'])
                return self.graph[start_node_str]['paths']
            if len(paths) > 0:
                #print paths
                #for path in paths:
                #    new_path = copy.copy(path)
                #new_path.insert(0, self.graph[start_node_str]['edgeTo'][node_str])
                self.graph[start_node_str]['paths'].add(self.graph[start_node_str]['edgeTo'][node_str])
                self.graph[start_node_str]['pathNodes'].add(self.graph[node_str]['nodeIndex'])
                self.graph[start_node_str]['paths'] |= paths
                self.graph[start_node_str]['pathNodes'] |= self.graph[node_str]['pathNodes']
                #print start_node_str
                #rint self.graph[start_node_str]['paths']
            self.graph[node_str]['visited'] = True
        self.graph[start_node_str]['visited'] = True
        return self.graph[start_node_str]['paths']
        #return False

    def find_paths_from_class_node(self):
        for start_node in self.graph.keys():
            self.graph[start_node]['visited'] = False
            self.graph[start_node]['pathsFrom'] = set(self.graph[start_node]['pathsFrom'])
            self.graph[start_node]['pathNodesFrom'] = set(self.graph[start_node]['pathNodesFrom'])
        for start_node in self.graph.keys():
            self.find_paths_from_class_node_helper(start_node)
        for start_node in self.graph.keys():
            self.graph[start_node]['pathsFrom'] = list(self.graph[start_node]['pathsFrom'])
            self.graph[start_node]['pathNodesFrom'] = list(self.graph[start_node]['pathNodesFrom'])

    def find_paths_from_class_node_helper(self, start_node_str):
        #print start_node_str
        if start_node_str == self.class_node_str:
            return True
        if self.graph[start_node_str]['visited']:
            return self.graph[start_node_str]['pathsFrom']
        for i, node_index in enumerate(self.graph[start_node_str]['nodeFrom']):
            node_str = self.node_index_to_name_map[node_index]
            paths = self.find_paths_from_class_node_helper(node_str)
            print node_str, paths
            if paths == True:
                self.graph[start_node_str]['pathsFrom'].add(self.graph[start_node_str]['edgeFrom'][i])
                self.graph[start_node_str]['pathNodesFrom'].add(node_index)
                return self.graph[start_node_str]['pathsFrom']
            if len(paths) > 0:
                self.graph[start_node_str]['pathsFrom'].add(self.graph[start_node_str]['edgeFrom'][i])
                self.graph[start_node_str]['pathNodesFrom'].add(node_index)
                self.graph[start_node_str]['pathsFrom'] |= set(paths)
                self.graph[start_node_str]['pathNodesFrom'] |= self.graph[node_str]['pathNodesFrom']
                #print start_node_str
                #rint self.graph[start_node_str]['paths']
            self.graph[node_str]['visited'] = True
        self.graph[start_node_str]['visited'] = True
        return self.graph[start_node_str]['pathsFrom']

    def color_markov_blanket(self, node):
        edges_from_parent = self.find_direct_parents(node)
        edges_to_children, child_str = self.find_direct_children(node)
        edges_spouse_to_child = self.find_spouse(child_str)
        #print(edges_from_parent, edges_to_children, edges_spouse_to_child)
        self.color_edges_nodes_in_path(edges_from_parent, self.color_to_class)
        self.color_edges_nodes_in_path(edges_to_children, self.color_from_class)
        self.color_edges_nodes_in_path(edges_spouse_to_child, self.color_spouse)
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)

    def find_direct_parents(self, node):
        edges_from_parent = []
        for from_node in self.graph.keys():
            if node in self.graph[from_node]['edgeTo'].keys():
                edges_from_parent.append(self.graph[from_node]['edgeTo'][node])
        return edges_from_parent

    def find_direct_children(self, node):
        edges_to_children = []
        children_str = []
        for key in self.graph[node]['edgeTo']:
            edges_to_children.append(self.graph[node]['edgeTo'][key])
            children_str.append(key)
        return edges_to_children, children_str

    def find_spouse(self, children_str):
        edges_spouse_to_child = []
        for from_node in self.graph.keys():
            children_from_node = self.graph[from_node]['edgeTo'].values()
            common_children = list(set(children_from_node) & set(children_str))
            for common_child in common_children:
                edges_spouse_to_child.append(self.graph[from_node]['edgeTo'][common_child])
        return edges_spouse_to_child

    def color_edges_nodes_in_path(self, path_array, color):
        modified_edges = []
        modified_node_str = []
        for line_index in path_array:
            if line_index not in modified_edges:
                self.dot_src_lines[line_index] = self.add_color_attr_to_edge(self.dot_src_lines[line_index], color)
                #print self.dot_src_lines[line_index]
                modified_edges.append(line_index)
                #print self.get_from_to_nodes_from_edge(self.dot_src_lines[line_index].strip())
                for node_str in self.get_from_to_nodes_from_edge(self.dot_src_lines[line_index].strip()):
                    if node_str not in modified_edges and node_str != self.class_node_str and node_str != self.selected_node:
                        self.add_color_node_to_end_src_lines(node_str, color)

    def color_edge(self, edge):
        self.set_dot_src_and_lines_to_uncolored_dot_src()
        self.selected_edge = edge
        self.selcted_node = None
        index_arr = [self.convert_edge_to_line_in_dot_src_lines(edge)]
        #print index_arr
        self.color_edges_nodes_in_path(index_arr, self.edge_selected_color)
        #print self.dot_src_lines[index_arr[0]]
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)

    def remove_selection_colors(self):
        self.set_dot_src_and_lines_to_uncolored_dot_src()

    def remove_selection(self):
        self.remove_selection_colors()
        if self.is_edge_selected():
            self.remove_edge(self.selected_edge)
        if self.is_node_selected():
            self.remove_node(self.selected_node)
        self.uncolored_dot_src = self.dot_src

    def remove_edge(self, edge_str):
        index = self.convert_edge_to_line_in_dot_src_lines(edge_str)
        self.dot_src_lines[index] = ""
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.selected_edge = None

    def remove_node(self, node_str):
        for to_node in self.graph[node_str].keys():
            self.dot_src_lines[self.graph[node_str]['edgeTo'][to_node]] = ""
        for node in self.graph.keys():
            if node_str in self.graph[node].keys():
                self.dot_src_lines[self.graph[node]['edgeTo'][node_str]] = ""
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.selected_node = None

    # Node1->Node2 returned from Graphviz
    def convert_edge_to_line_in_dot_src_lines(self, edge):
        nodes = edge.split("->")
        node1 = str(nodes[0])
        node2 = str(nodes[1])
        if node1 in self.graph[node2]['edgeTo'].keys():
            index = self.graph[node2]['edgeTo'][node1]
        else:
            index = self.graph[node1]['edgeTo'][node2]
        return index

    def get_from_to_nodes_from_edge(self, edge):
        edgeInfo = edge.split(" ")
        return [str(edgeInfo[0]), str(edgeInfo[2])] #fliped in title of edge

    def add_color_node_to_end_src_lines(self, node, color):
        self.dot_src_lines.insert(len(self.dot_src_lines)-1, self.create_color_node_attr(node, color))

    def create_color_node_attr(self, node_str, color):
        return node_str + " [color=" + color + "];"

    def add_color_attr_to_edge(self, edge_str, color):
        return edge_str.replace("];", ", color=" + color + "];")

    def trim_init_src_string(self, src):
        src = str(src)
        src = src.replace("\"", "")
        return src

    def is_edge_selected(self):
        return self.selected_edge != None

    def is_node_selected(self):
        return self.selected_node != None
