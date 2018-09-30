import pydot
import numpy as np
from pycausal.pycausal import pycausal as pc
from pycausal import search as s
import pandas as pd
import copy

class CausalGraph:
    def __init__(self, datapath):
        self.class_node_str = 'CLASS'
        self.edge_to_dot_src_line_offset = 2
        self.markov_blanket_selected = True
        self.selected_node = None
        self.selected_edge = None
        self.color_to_class = "\"0.578 0.289 1.000\""  #parent
        self.color_from_class = "\"0.00 0.500 1.000\"" #child
        self.color_spouse = "\"0.578 0.289 1.000\""
        self.class_node_color = "\"0.000 1.000 0.750\"" #0.650 0.200 1.000
        self.selected_node_color = "yellow"
        self.edge_selected_color = "\"0.650 0.200 1.000\""
        self.init_causal_graph_dot_src(datapath)
        self.edges_to_graph_dict()
        self.init_spouse_graph()
        self.find_paths_to_class_node()
        #self.color_markov_blanket('CLASS')
        #self.color_edges_nodes_to_class_node('AC')

    def init_causal_graph_dot_src(self, datapath):
        df = pd.read_csv(datapath)
        p = pc()
        p.start_vm()
        tetrad = s.tetradrunner()
        tetrad.run(algoId = 'fges', dfs = df, scoreId = 'sem-bic', dataType = 'continuous', penaltyDiscount = 2, maxDegree = -1, faithfulnessAssumed = True, verbose = True)
        dot_src = p.tetradGraphToDot(tetrad.getTetradGraph())
        self.edges = tetrad.getEdges()
        self.nodes = tetrad.getNodes()
        dot_src = self.trim_init_src_string(dot_src)
        self.dot_src_lines = self.dot_src_to_lines(dot_src)
        self.insert_node_attr_dot_src()
        self.insert_class_node_color()
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.init_dot_src = self.dot_src
        self.uncolored_dot_src = self.init_dot_src
        p.stop_vm()

    def insert_node_attr_dot_src(self):
        self.dot_src_lines.insert(1, 'node [style=filled];')

    def insert_class_node_color(self):
        self.add_color_node_to_end_src_lines(self.class_node_str, self.class_node_color)
        #elf.dot_src_lines.insert(len(self.dot_src_lines)-1, self.class_node_str + "[color=" + self.class_node_color + "]")

    def dot_src_to_lines(self, dot_src):
        return dot_src.splitlines()

    def lines_to_dot_src(self, lines):
        return "\n".join(lines)

    def edges_to_graph_dict(self):
        self.graph = dict()
        #for node in self.nodes:
        #    self.graph[str(node)] = dict()
        node_index = 1
        for index, edge in enumerate(self.edges):
            dot_src_line_index = index + self.edge_to_dot_src_line_offset
            edgeInfo = edge.split(" ")
            fromNode = str(edgeInfo[0])
            toNode = str(edgeInfo[2])
            if fromNode not in self.graph.keys():
                self.graph[fromNode] = dict()
                self.graph[fromNode]['edgeTo'] = dict()
                self.graph[fromNode]['nodeIndex'] = node_index
                self.graph[fromNode]['edgeFrom'] = []
                self.graph[fromNode]['nodeFrom'] = []
                self.graph[fromNode]['nodeTo'] = []
                self.graph[fromNode]['spouseEdge'] = []
                self.graph[fromNode]['spouseNode'] = []
                self.graph[fromNode]['paths'] = set()
                self.graph[fromNode]['pathNodes'] = set()
                self.graph[fromNode]['visited'] = False
                node_index += 1
            if toNode not in self.graph.keys():
                self.graph[toNode] = dict()
                self.graph[toNode]['edgeTo'] = dict()
                self.graph[toNode]['nodeIndex'] = node_index
                self.graph[toNode]['edgeFrom'] = []
                self.graph[toNode]['nodeFrom'] = []
                self.graph[toNode]['nodeTo'] = []
                self.graph[toNode]['spouseEdge'] = []
                self.graph[toNode]['spouseNode'] = []
                self.graph[toNode]['paths'] = set()
                self.graph[toNode]['pathNodes'] = set()
                self.graph[toNode]['visited'] = False
                node_index += 1
            self.graph[fromNode]['edgeTo'][toNode] = dot_src_line_index
            self.graph[toNode]['edgeFrom'].append(dot_src_line_index)
            self.graph[toNode]['nodeFrom'].append(self.graph[fromNode]['nodeIndex'])
            self.graph[fromNode]['nodeTo'].append(self.graph[toNode]['nodeIndex'])

    def init_spouse_graph(self):
        for index, edge in enumerate(self.edges):
            dot_src_line_index = index + self.edge_to_dot_src_line_offset
            edgeInfo = edge.split(" ")
            fromNode = str(edgeInfo[0])
            toNode = str(edgeInfo[2])
            for i, edge in enumerate(self.graph[toNode]['edgeFrom']):
                if edge != dot_src_line_index:
                    node = self.graph[toNode]['nodeFrom'][i]
                    if  node not in self.graph[fromNode]['nodeFrom'] and edge not in self.graph[fromNode]['nodeTo']:
                        self.graph[fromNode]['spouseEdge'].append(edge)
                        self.graph[fromNode]['spouseNode'].append(node)

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
                    print node_str
                    self.graph[node_str]['paths'].append([self.graph[node_str]['edgeTo'][node_to]])
                    print self.graph[node_str]['paths']
                else:
                    self.find_paths_to_class(node_to)
                    print self.graph[node_to]['paths']
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
        #current_path = []
        #all_paths = []
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
            paths = self.find_paths_to_class_node_helper(node_str)
            print paths, node_str, start_node_str
            if paths == True:
                self.graph[start_node_str]['paths'].add(self.graph[start_node_str]['edgeTo'][node_str])
                self.graph[start_node_str]['pathNodes'].add(self.graph[node_str]['nodeIndex'])
                #print self.graph[start_node_str]['paths']
                return self.graph[start_node_str]['paths']
            if len(paths) > 0:
                print paths
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

    def color_markov_blanket(self, node):
        edges_from_parent = self.find_direct_parents(node)
        edges_to_children, child_str = self.find_direct_children(node)
        edges_spouse_to_child = self.find_spouse(child_str)
        print(edges_from_parent, edges_to_children, edges_spouse_to_child)
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
                print self.dot_src_lines[line_index]
                modified_edges.append(line_index)
                print self.get_from_to_nodes_from_edge(self.dot_src_lines[line_index].strip())
                for node_str in self.get_from_to_nodes_from_edge(self.dot_src_lines[line_index].strip()):
                    if node_str not in modified_edges and node_str != self.class_node_str and node_str != self.selected_node:
                        self.add_color_node_to_end_src_lines(node_str, color)

    def color_edge(self, edge):
        self.set_dot_src_and_lines_to_uncolored_dot_src()
        self.selected_edge = edge
        self.selcted_node = None
        index_arr = [self.convert_edge_to_line_in_dot_src_lines(edge)]
        print index_arr
        self.color_edges_nodes_in_path(index_arr, self.edge_selected_color)
        print self.dot_src_lines[index_arr[0]]
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
