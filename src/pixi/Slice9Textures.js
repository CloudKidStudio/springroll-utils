(function() {
	
	var Container = include("PIXI.Container"),
		Texture = include("PIXI.Texture");
	
	/**
	 * @class Slice9Textures
	 * @constructor
	 * @param {PIXI.Texture} origTexture The original texture to create the texture slices from.
	 * @param {Object} sliceData Data about the slices to make.
	 * @param {Array} sliceData.vSlices An array of pixel positions in the texture at which to
	 *                                 make the two vertical slices. A value of [20, 40] makes
	 *                                 textures from 0 to 20, 20 to 40, and 40 to the full width of
	 *                                 the texture.
	 * @param {Array} sliceData.hSlices An array of pixel positions in the texture at which to
	 *                                 make the two horizontal slices. A value of [20, 40] makes
	 *                                 textures from 0 to 20, 20 to 40, and 40 to the full height of
	 *                                 the texture.
	 */
	var Slice9Textures = function(origTexture, sliceData)
	{
		if(typeof origTexture == "string")
			origTexture = Texture.fromFrame(origTexture);
		
		this.origWidth = origTexture.width;
		this.origHeight = origTexture.height;
		
		var vSlices = sliceData.vSlices;
		var hSlices = sliceData.hSlices;
		var texture;
		
		//left and right sides (vertical center)
		texture = this.left = sliceTexture(origTexture, 0, vSlices[0], hSlices[0], hSlices[1]);
		this.leftWidth = texture.width;
		texture = this.right = sliceTexture(origTexture, vSlices[1], this.origWidth, hSlices[0], hSlices[1]);
		this.rightWidth = texture.width;
		
		//the center-center
		texture = this.center = sliceTexture(origTexture, vSlices[0], vSlices[1], hSlices[0], hSlices[1]);
		this.centerWidth = texture.width;
		this.centerHeight = texture.height;
		
		//top and bottom sides (horizontal center)
		texture = this.top = sliceTexture(origTexture, vSlices[0], vSlices[1], 0, hSlices[0]);
		this.topHeight = texture.height;
		texture = this.bottom = sliceTexture(origTexture, vSlices[0], vSlices[1], hSlices[1], this.origHeight);
		this.bottomHeight = texture.height;
		
		//corners
		this.topLeft = sliceTexture(origTexture, 0, vSlices[0], 0, hSlices[0]);
		this.topRight = sliceTexture(origTexture, vSlices[1], this.origWidth, 0, hSlices[0]);
		this.bottomLeft = sliceTexture(origTexture, 0, vSlices[0], hSlices[1], this.origHeight);
		this.bottomRight = sliceTexture(origTexture, vSlices[1], this.origWidth, hSlices[1], this.origHeight);
	};
	
	var p = Slice9Textures.prototype = {};
	
	function sliceTexture(origTexture, left, right, top, bottom)
	{
		var texture = new Texture(origTexture.baseTexture, origTexture.frame.clone());
		if(origTexture.trim)
			texture.trim = origTexture.trim.clone();
		
		var scale = texture.baseTexture.resolution;
		
		texture.crop.x += left * scale;
		texture.crop.width = (right - left) * scale;
		texture.width = texture.crop.width / scale;
		texture.crop.y += top * scale;
		texture.crop.height = (bottom - top) * scale;
		texture.height = texture.crop.height / scale;
		texture._updateUvs();
		return texture;
	}

	p.destroy = function()
	{
		if(!this.center) return;
		
		this.center.destroy();
		this.left.destroy();
		this.right.destroy();
		this.top.destroy();
		this.bottom.destroy();
		this.topLeft.destroy();
		this.topRight.destroy();
		this.bottomLeft.destroy();
		this.bottomRight.destroy();
		this.topLeft = this.topRight = this.bottomLeft = this.bottomRight = this.left = this.right =
			this.center = this.top = this.bottom = null;
	};

	namespace('springroll.pixi').Slice9Textures = Slice9Textures;
}());