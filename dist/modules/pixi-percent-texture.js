/*! springroll-utils 0.0.1 */
(function() {
	
	var Texture = include("PIXI.Texture");
	
	var PercentTexture = function(base, useHeight, min, max, invertScaling, roundToInts)
	{
		var trim;
		if(base.trim)
			trim = base.trim.clone();
		else
		{
			trim = base.crop.clone();
			trim.x = trim.y = 0;
		}
		Texture.call(this, base.baseTexture, base.frame.clone(), base.crop.clone(), trim);
		
		this.useHeight = !!useHeight;
		this.invertScaling = !!invertScaling;
		if(this.invertScaling)
		{
			this.origPos = this.useHeight ? this.crop.y : this.crop.x;
			this.origTrim = this.useHeight ? this.trim.y : this.trim.x;
		}

		this.min = min || 0;
		this.max = max === undefined ? (this.useHeight ? this.crop.height : this.crop.width) : max;
		
		this.useRounding = !!roundToInts;

		this.setPercent(1);
	};

	// Extend BaseState
	var p = extend(PercentTexture, Texture);

	var s = Texture.prototype;

	//percent is 0.0-1.0
	p.setPercent = function(percent)
	{
		if(percent < 0)
			percent = 0;
		else if(percent > 1)
			percent = 1;
		var val = this.min + (this.max - this.min) * percent;
		if(this.invertScaling)
		{
			if(this.useHeight)
			{
				this.crop.y = this.origPos + (this.max - val);
				this.crop.height = val;
				this.trim.y = this.origTrim + (this.max - val);
			}
			else
			{
				this.crop.x = this.origPos + (this.max - val);
				this.crop.width = val;
				this.trim.x = this.origTrim + (this.max - val);
			}
		}
		else
		{
			if(this.useHeight)
				this.crop.height = val;
			else
				this.crop.width = val;
		}
		//if the texture is on the edge of the texture, or if we are doing tinting in a canvas
		//fallback, and the width/height ends up being outside of the texture, then some browsers
		//don't handle that well
		if(this.useRounding)
		{
			//do a quick floor
			this.crop.width |= 0;
			this.crop.height |= 0;
		}
		
		this._updateUvs();
	};

	p.destroy = function(destroyBase)
	{
		s.destroy.call(this, destroyBase);
	};

	namespace('springroll.pixi').PercentTexture = PercentTexture;
}());