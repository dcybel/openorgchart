OpenLayers.Control.ToggleTreeNode = OpenLayers.Class(OpenLayers.Control, {
    onToggle: function() {},
    layer: null,
    callbacks: null,
    handlers: null,

    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
		
        var callbacks = {
            dblclick: this.doubleClickFeature,
        };
        
        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);
        this.handlers = {
            feature: new OpenLayers.Handler.Feature(
                this, layer, this.callbacks
            )
        };
    },

    activate: function () {
        if (!this.active) {
            this.handlers.feature.activate();
        }
        return OpenLayers.Control.prototype.activate.apply(
            this, arguments
        );
    },

    deactivate: function () {
        if (this.active) {
            this.handlers.feature.deactivate();
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },

    doubleClickFeature: function(feature) {
		this.onToggle(feature);
    },
	
    setMap: function(map) {
        this.handlers.feature.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Control.ToggleTreeNode"
});
