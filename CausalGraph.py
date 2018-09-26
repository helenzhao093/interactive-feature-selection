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
        self.color_to_class = "\"0.578 0.289 1.000\""  #parent
        self.color_from_class = "\"0.00 0.500 1.000\"" #child
        self.color_spouse = "\"0.578 0.289 1.000\""
        self.class_node_color = "\"0.000 1.000 0.750\"" #0.650 0.200 1.000
        self.init_causal_graph_dot_src(datapath)
        self.edges_to_graph_dict()

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

        #self.dot_src_lines[5] = ""

        self.insert_node_attr_dot_src()
        self.insert_class_node_color()
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)
        self.init_dot_src = self.dot_src
        p.stop_vm()

    def insert_node_attr_dot_src(self):
        self.dot_src_lines.insert(1, 'node [style=filled];')

    def insert_class_node_color(self):
        self.dot_src_lines.insert(len(self.dot_src_lines)-1, self.class_node_str + "[color=" + self.class_node_color + "]")

    def dot_src_to_lines(self, dot_src):
        return dot_src.splitlines()

    def lines_to_dot_src(self, lines):
        return "\n".join(lines)

    def edges_to_graph_dict(self):
        self.graph = dict()
        for node in self.nodes:
            self.graph[str(node)] = dict()
        for index, edge in enumerate(self.edges):
            dot_src_line_index = index + self.edge_to_dot_src_line_offset
            edgeInfo = edge.split(" ")
            fromNode = str(edgeInfo[0])
            toNode = str(edgeInfo[2])
            self.graph[fromNode][toNode] = dot_src_line_index

    def toggle_markov_blanket_selected(self):
        self.markov_blanket_selected = not self.markov_blanket_selected
        print self.markov_blanket_selected, self.selected_node
        if self.selected_node != None:
            self.color_graph_select_node(self.selected_node)

    def color_graph_select_node(self, node):
        self.selected_node = node
        self.dot_src = self.init_dot_src
        self.dot_src_lines = self.dot_src_to_lines(self.dot_src)
        if self.markov_blanket_selected:
            self.color_markov_blanket(node)
        else:
            self.color_edges_nodes_to_class_node(node)

    def color_edges_nodes_to_class_node(self, start_node):
        paths = self.find_paths_to_class_node(start_node)
        for path in paths:
            self.color_edges_nodes_in_path(path, self.color_to_class)
        self.dot_src = self.lines_to_dot_src(self.dot_src_lines)

    def find_paths_to_class_node(self, start_node):
        current_path = []
        all_paths = []
        self.find_paths_to_class_node_helper(start_node, current_path, all_paths)
        return all_paths

    def find_paths_to_class_node_helper(self, start_node_str, current_path, all_paths):
        if start_node_str == self.class_node_str:
            all_paths.append(current_path)
        for node_str in self.graph[start_node_str].keys():
            updated_path = copy.copy(current_path)
            updated_path.append(self.graph[start_node_str][node_str]) # index of new edge
            self.find_paths_to_class_node_helper(node_str, updated_path, all_paths)

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
            if node in self.graph[from_node].keys():
                edges_from_parent.append(self.graph[from_node][node])
        return edges_from_parent

    def find_direct_children(self, node):
        edges_to_children = []
        children_str = []
        for key in self.graph[node]:
            edges_to_children.append(self.graph[node][key])
            children_str.append(key)
        return edges_to_children, children_str

    def find_spouse(self, children_str):
        edges_spouse_to_child = []
        for from_node in self.graph.keys():
            children_from_node = self.graph[from_node].values()
            common_children = list(set(children_from_node) & set(children_str))
            for common_child in common_children:
                edges_spouse_to_child.append(self.graph[from_node][common_child])
        return edges_spouse_to_child

    def color_edges_nodes_in_path(self, path_array, color):
        modified_edges = []
        modified_node_str = []
        for line_index in path_array:
            if line_index not in modified_edges:
                self.dot_src_lines[line_index] = self.add_color_attr_to_edge(self.dot_src_lines[line_index], color)
                modified_edges.append(line_index)
                for node_str in self.get_from_to_nodes_from_edge(self.dot_src_lines[line_index].strip()):
                    if node_str not in modified_edges and node_str != self.class_node_str:
                        self.add_color_node_to_end_src_lines(node_str, color)

    def get_from_to_nodes_from_edge(self, edge):
        edgeInfo = edge.split(" ")
        return [str(edgeInfo[0]), str(edgeInfo[2])]

    def add_color_node_to_end_src_lines(self, node, color):
        self.dot_src_lines.insert(len(self.dot_src_lines)-1, self.create_color_node_attr(node, color))

    def create_color_node_attr(self, node_str, color):
        return node_str + " [color=" + color + "];"

    def add_color_attr_to_edge(self, edge_str, color):
        return edge_str.replace("];", ", color=" + color + "];")


    def trim_init_src_string(self, src):
        src = str(src)
        #src = src.replace(" ", "")
        src = src.replace("\"", "")
        return src
