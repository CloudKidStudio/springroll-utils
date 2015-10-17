(function() {
	
	var Button = include("springroll.pixi.Button"),
		Sprite = include("PIXI.Sprite"),
		Texture = include("PIXI.Texture");
	
	/**
	 * @class IconButton
	 * @constructor
	 * @param {Slice3Textures} texture
	 */
	var IconButton = function(imageSettings, label, iconData, enabled)
	{
		//do super constructor
		Button.call(this, imageSettings, label, enabled);
		
		//create the icon sprite
		this.icon = new Sprite();
		if(iconData.pos)
		{
			this.icon.x = iconData.pos.x;
			this.icon.y = iconData.pos.y;
		}
		if(iconData.scale)
		{
			this.icon.scale.x = iconData.scale.x;
			this.icon.scale.y = iconData.scale.y;
		}
		
		//add icon above background, but below label
		this.addChildAt(this.icon, 1);
		
		var defaultTexture = iconData.icon || imageSettings.up.icon;
		
		//set up the icon textures
		for(var key in this._stateData)
		{
			var icon;
			if(imageSettings[key])
				icon = imageSettings[key].icon || defaultTexture;
			else
				icon = defaultTexture;
			if(typeof icon == "string")
				icon = Texture.fromImage(icon);
			this._stateData[key].icon = icon;
		}
		
		//update the button state
		this._updateState();
	};

	// Extend BaseState
	var p = extend(IconButton, Button);

	var s = Button.prototype;
	
	p._Button_updateState = p._updateState;
	
	p._updateState = function()
	{
		if(!this.icon) return;
		
		var data = this._Button_updateState();
		this.icon.texture = data.icon;
	};

	p.destroy = function()
	{
		if(!this.back) return;
		
		s.destroy.call(this);
		
		this.icon = null;
	};

	namespace('springroll.pixi').IconButton = IconButton;
}());