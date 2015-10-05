/*! springroll-utils 0.0.1 */
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
(function() {
	
	var Container = include("PIXI.Container"),
		Sprite = include("PIXI.Sprite");
	
	/**
	 * @class Slice3Sprite
	 * @constructor
	 * @param {Slice3Textures} texture
	 */
	var Slice3Sprite = function(texture)
	{
		Container.call(this);
		
		this.isHorizontal = texture.isHorizontal;
		
		this.sliceTexture = texture;
		
		if(this.isHorizontal)
		{
			this.left = new Sprite(texture.left);
			this.center = new Sprite(texture.center);
			this.center.x = texture.leftWidth;
			this.right = new Sprite(texture.right);
			
			this.addChild(this.left);
			this.addChild(this.center);
			this.addChild(this.right);
			
			this.setWidth(texture.origWidth);
		}
		else
		{
			this.top = new Sprite(texture.top);
			this.center = new Sprite(texture.center);
			this.center.y = texture.topHeight;
			this.bottom = new Sprite(texture.bottom);
			
			this.addChild(this.top);
			this.addChild(this.center);
			this.addChild(this.bottom);
			
			this.setHeight(texture.origHeight);
		}
		
		this._tint = 0xffffff;
	};

	// Extend BaseState
	var p = extend(Slice3Sprite, Container);
	var s = Container.prototype;
	
	Object.defineProperty(p, "tint", {
		get: function() { return this._tint; },
		set: function(value)
		{
			this._tint = value;
			this.center.tint = value;
			if(this.left)
			{
				this.left.tint = this.right.tint = value;
			}
			else
			{
				this.top.tint = this.bottom.tint = value;
			}
		}
	});
	
	p.setWidth = function(width)
	{
		var scale;
		var sliceTexture = this.sliceTexture;
		if(this.isHorizontal)
		{
			if(width >= sliceTexture.leftWidth + sliceTexture.rightWidth)
			{
				var center = width - sliceTexture.leftWidth - sliceTexture.rightWidth;
				this.left.scale.x = this.right.scale.x = 1;
				this.center.scale.x = center / sliceTexture.centerWidth;
				this.right.x = center + sliceTexture.leftWidth;
				this.center.visible = true;
			}
			else
			{
				scale = width / (sliceTexture.leftWidth + sliceTexture.rightWidth);
				this.left.scale.x = this.right.scale.x = scale;
				this.right.x = sliceTexture.leftWidth * scale;
				this.center.visible = false;
			}
		}
		else
		{
			scale = width / sliceTexture.origWidth;
			this.top.scale.x = scale;
			this.center.scale.x = scale;
			this.bottom.scale.x = scale;
		}
	};
	
	p.setHeight = function(height)
	{
		var scale;
		var sliceTexture = this.sliceTexture;
		if(this.isHorizontal)
		{
			scale = height / sliceTexture.origHeight;
			this.left.scale.y = scale;
			this.center.scale.y = scale;
			this.right.scale.y = scale;
		}
		else
		{
			if(height >= sliceTexture.topHeight + sliceTexture.bottomHeight)
			{
				var center = height - sliceTexture.topHeight - sliceTexture.bottomHeight;
				this.top.scale.y = this.bottom.scale.y = 1;
				this.center.scale.y = center / sliceTexture.centerHeight;
				this.bottom.y = center + sliceTexture.topHeight;
				this.center.visible = true;
			}
			else
			{
				scale = height / (sliceTexture.topHeight + sliceTexture.bottomHeight);
				this.top.scale.y = this.bottom.scale.y = scale;
				this.bottom.y = sliceTexture.topHeight * scale;
				this.center.visible = false;
			}
		}
	};

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
		s.destroy.call(this);
		this.left = this.right = this.center = this.top = this.bottom = null;
	};

	namespace('springroll.pixi').Slice3Sprite = Slice3Sprite;
}());