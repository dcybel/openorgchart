// Tree rendering variables
var nodeSize = 25;
var horizontalSpacing = 5000;
var verticalSpacing = 5000;

var map, lines, nodes, toggleControl; // OenLayers variables
var tree, root; // Tree variables

var symbols = [
	'symbols/Ground_Track_-_Unit_-_Combat_-_Anti-Armour_-_Friendly.svg.png',
	'symbols/Ground_Track_-_Unit_-_Combat_-_Aviation_-_Fixed_Wing_-_Friendly.svg.png',
	'symbols/Ground_Track_-_Unit_-_Combat_-_Air_Defence_-_Friendly.svg.png',
	'symbols/Ground_Track_-_Unit_-_Combat_Service_Support_-_Medical_-_Medical_Treatment_Facility_-_Friendly.svg.png',
	'symbols/Ground_Track_-_Unit_-_Combat_Service_Support_-_Supply_-_Class_III_-_Friendly.svg.png'
];

function init() {
	lines = new OpenLayers.Layer.Vector("Org Chart Lines", {isBaseLayer:true});
	
	nodes = new OpenLayers.Layer.Vector("Org Chart Nodes", {isBaseLayer:false});
	
	map = new OpenLayers.Map('map', {
		controls: [
			new OpenLayers.Control.MouseDefaults(),
			new OpenLayers.Control.PanZoomBar()
		],
		eventListeners: {zoomend: onZoomEnd},
		maxExtent: new OpenLayers.Bounds(-100000, -100000, 100000, 100000),
		resolutions: [64, 32, 16]
	});
	
	toggleControl = new OpenLayers.Control.ToggleTreeNode(nodes, {
		onToggle: onTreeNodeToggle
	});
	
	map.addControl(toggleControl);
	map.addLayers([lines, nodes]);
	map.setCenter(new OpenLayers.LonLat(0, 0));
	
	toggleControl.activate();
	
	tree = randomTreeData();
	
	renderRoot();
}

function onZoomEnd(event) {
	for (var i = 0; i < nodes.features.length; i++) {
		nodes.features[i].style.pointRadius = nodeSize * (map.zoom + 1);
	}
	nodes.redraw();
	for (var i = 0; i < lines.features.length; i++) {
		lines.features[i].style.strokeWidth = map.zoom + 1;
	}
	lines.redraw();
}

function onTreeNodeToggle(node) {
	toggleChildren(node);
}

function onTreeNodeUnselect(node) {
}

function renderRoot() {
	root = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0, 0));
	root.events = new OpenLayers.Events(root);
	root.children = tree.children;
	root.name = tree.name;
	root.img = tree.image;
	root.style = {};
	root.style.externalGraphic = root.img;
	root.style.pointRadius = nodeSize;
	nodes.addFeatures([root]);
}

function toggleChildren(node) {
	// Remove the children if they are already rendered
	if (node.childrenRendered) {
		lines.removeFeatures(node.pathToChildren);
		lines.removeFeatures(node.horizontalLine);
		
		for (var i = 0; i < node.children.length; i++) {
			// recursive call to remove children down the tree
			if (node.children[i].childrenRendered)
				toggleChildren(node.children[i]);
			
			lines.removeFeatures([node.children[i].pathToParent]);
			nodes.removeFeatures([node.children[i]]);
		}
		node.childrenRendered = false;
	}
	// Otherwise ensure that the children have not already been rendered and that there are children to render
	else if (!node.childrenRendered && node.children) {
		// Calculate the starting X coordinate and the Y coordinate to render the children
		var leftMostChild = node.geometry.x - horizontalSpacing * (node.children.length - 1) / 2;
		var childLevel = node.geometry.y - verticalSpacing;
		
		// Calculate the connecting parent line and horizontal line for the children
		var parentLine = new OpenLayers.Feature.Vector(
			new OpenLayers.Geometry.LineString([
				new OpenLayers.Geometry.Point(node.geometry.x, node.geometry.y),
				new OpenLayers.Geometry.Point(node.geometry.x, node.geometry.y - verticalSpacing / 2)
			])
		);
		parentLine.style = {strokeColor: '#000000', strokeWidth: map.zoom + 1};
		var horizontalLine = new OpenLayers.Feature.Vector(
			new OpenLayers.Geometry.LineString([
				new OpenLayers.Geometry.Point(leftMostChild, node.geometry.y - verticalSpacing / 2),
				new OpenLayers.Geometry.Point(leftMostChild + horizontalSpacing * (node.children.length - 1), node.geometry.y - verticalSpacing / 2)
			])
		);
		horizontalLine.style = {strokeColor: '#000000', strokeWidth: map.zoom + 1};
		lines.addFeatures([parentLine, horizontalLine]);
		
		node.pathToChildren = parentLine;
		node.horizontalLine = horizontalLine;
		
		// Iterate through the children and render them
		for (var i = 0; i < node.children.length; i++) {
			var child = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(leftMostChild + horizontalSpacing * i, childLevel));
			child.children = node.children[i].children;
			child.parent = node;
			child.name = node.children[i].name;
			child.index = i;
			child.img = (node.children[i].image) ? node.children[i].image : node.children[i].img;
			child.style = {};
			child.style.externalGraphic = child.img;
			child.style.pointRadius = nodeSize * (map.zoom + 1);
			nodes.addFeatures([child]);
			
			var line = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.LineString([
					new OpenLayers.Geometry.Point(child.geometry.x, node.geometry.y - verticalSpacing / 2),
					new OpenLayers.Geometry.Point(child.geometry.x, child.geometry.y)
				])
			);
			line.style = {strokeColor: '#000000', strokeWidth: map.zoom + 1};
			lines.addFeatures([line]);
			
			node.children[i] = child;
			child.pathToParent = line;
		}
		node.childrenRendered = true;
	}
	
	// this function will recurse through the tree to make it "well-formed" or pretty
	modify(root);
	nodes.redraw();
}

function modify(node) {
	// make sure there is a parent - i.e. not root
	if (node.parent && node.index > 0) {
		var leftSibling = node.parent.children[node.index - 1];
		
		// check whether or not children are rendered
		if (leftSibling.childrenRendered && node.childrenRendered) {
			var diff = node.children[0].geometry.x - leftSibling.children[leftSibling.children.length - 1].geometry.x;
			
			if (diff < horizontalSpacing) {
				for (var i = 0; i < node.children.length; i++) {
					node.children[i].geometry.move(horizontalSpacing - diff, 0);
				}
				
				center(node);
			}
		}
	}

	if (node.childrenRendered) {
		for (var i = 0; i < node.children.length; i++) {
			modify(node.children[i]);
		}
	}
}

function center(node) {
	var leftMostChild = node.children[0];
	var rightMostChild = node.children[node.children.length - 1];
	alert('leftmost: ' + leftMostChild.geometry.x + ' - rightmost: ' + rightMostChild.geometry.x);
	var diff = (leftMostChild.geometry.x + rightMostChild.geometry.x) / 2;
	
	node.geometry.move(diff, 0);
	
	if (node.parent) center(node.parent);
}

function randomTreeData() {
	var data = {
		name: 'root',
		image: symbols[rand(symbols.length) - 1]
	};
	addChildrenToTree(data, 0);
	return data;
}

function addChildrenToTree(data, depth) {
	depth++;
	var numchildren = rand(5);
	data.children = [];
	
	for (var i = 0; i < numchildren; i++) {
		data.children[i] = {
			name: 'child' + i,
			image: symbols[rand(symbols.length) - 1]
		};
		if (depth < 4) addChildrenToTree(data.children[i], depth);
	}
}

function rand(n) {
	return (Math.floor(Math.random() * n + 1));
}
