(function() {
	
	var Container = include("PIXI.Container"),
		Texture = include("PIXI.Texture");
	
	/**
	 * @class Slice3Textures
	 * @constructor
	 * @param {PIXI.Texture} origTexture The original texture to create the texture slices from.
	 * @param {Object} sliceData Data about the slices to make.
	 * @param {String} [sliceData.mode="v"] The slicing mode - "v" for vertical (2 slices across
	 *                                      the texture to make a vertical stack of 3 textures)
	 *                                      or "v" for horizontal (2 slices down the texture to
	 *                                      make a horizontal row of 3 textures).
	 * @param {Array} sliceData.slices An array of pixel positions in the texture at which to
	 *                                 make the two slices. A value of [20, 40] makes textures from
	 *                                 0 to 20, 20 to 40, and 40 to the full size of the texture.
	 */
	var Slice3Textures = function(origTexture, sliceData)
	{
		if(typeof origTexture == "string")
			origTexture = Texture.fromFrame(origTexture);
		
		this.origWidth = origTexture.width;
		this.origHeight = origTexture.height;
		
		this.isHorizontal = sliceData.mode == "h";
		
		var slices = sliceData.slices;
		var texture;
		if(this.isHorizontal)
		{
			texture = this.left = sliceTexture(origTexture, 0, slices[0], true);
			this.leftWidth = texture.width;
			texture = this.center = sliceTexture(origTexture, slices[0], slices[1], true);
			this.centerWidth = texture.width;
			texture = this.right = sliceTexture(origTexture, slices[1], this.origWidth, true);
			this.rightWidth = texture.width;
		}
		else
		{
			texture = this.top = sliceTexture(origTexture, 0, slices[0], false);
			this.topHeight = texture.height;
			texture = this.center = sliceTexture(origTexture, slices[0], slices[1], false);
			this.centerHeight = texture.height;
			texture = this.bottom = sliceTexture(origTexture, slices[1], this.origHeight, false);
			this.bottomHeight = texture.height;
		}
	};
	
	var p = Slice3Textures.prototype = {};
	
	function sliceTexture(origTexture, sliceStart, sliceEnd, isHorizontal)
	{
		var texture = new Texture(origTexture.baseTexture, origTexture.frame.clone());
		if(origTexture.trim)
			texture.trim = origTexture.trim.clone();
		
		var scale = texture.baseTexture.resolution;
		
		if(isHorizontal)
		{
			texture.crop.x += sliceStart * scale;
			texture.crop.width = (sliceEnd - sliceStart) * scale;
			texture.width = texture.crop.width / scale;
		}
		else
		{
			texture.crop.y += sliceStart * scale;
			texture.crop.height = (sliceEnd - sliceStart) * scale;
			texture.height = texture.crop.height / scale;
		}
		texture._updateUvs();
		return texture;
	}

	p.destroy = function()
	{
		if(!this.center) return;
		
		this.center.destroy();
		if(this.left)
		{
			this.left.destroy();
			this.right.destroy();
		}
		else
		{
			this.top.destroy();
			this.bottom.destroy();
		}
		this.left = this.right = this.center = this.top = this.bottom = null;
	};

	namespace('springroll.pixi').Slice3Textures = Slice3Textures;
}());