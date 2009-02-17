// Basic Globals
var horizontalSpacing = 100;
var verticalSpacing = 100;

// Tree Node Structure
function Node() {
	// Keeping track of this node's relatives
	this.parent = null; // pointer to the parent node
	this.firstChild = null; // pointer to the first (leftmost?) child
	this.leftSibling = null; // pointer to this node's sibling immediately to the left
	this.rightSibling = null; // pointer to this node's sibling immediately to the right
	
	// Flag to indicate if sons have been modified
	this.flag;
	
	// Distance between this node and its sibling immediately to the left
	this.leftDistance;
	
	// Array of children
	this.children = [];
}

function modify(current){
	// stop if current node is the root node and its flag is zero
	if ((!current.parent) && current.flag == 0)
		return;
	
	operationB(current);
	
	if
}

// center the parent
function operationA(node){
	// calculate the difference of horizontal distance
	var diff = node.x - (node.children[0].x + node.children[node.children.length - 1].x) / 2;
	
	if (diff < 0)
		node.x -= diff;
	else
		node.moveChildren(diff); //TODO: write Node member function moveChildren
}

// deinterlace children
function operationB(node){
	// check if this node has a sibling immediately to the left
	if (node.leftSibling) {
		// check whether or not the left sibling has any children
		if (node.leftSibling.children.length > 0 && node.children.length > 0) {
			var diff = node.children[0].x - node.leftSibling.children[node.leftSibling.children.length - 1].x;
			
			if (diff < horizontalSpacing)
				node.moveChildren(horizontalSpacing - diff);
		}
	}
}

// tree compacting - TODO: write this function
function operationY(){
}
