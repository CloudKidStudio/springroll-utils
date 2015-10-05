/*! springroll-utils 0.0.1 */
(function() {
	
	var Application = include("springroll.Application");
	
	var ButtonSounds = function(downAlias, overAlias, button)
	{
		this.onOver = this.onOver.bind(this);
		this.onDown = this.onDown.bind(this);
		
		this.downAlias = downAlias;
		this.overAlias = overAlias;
		
		this._addedButtons = [];
		
		if(button)
			this.addButton(button);
	};
	
	var p = ButtonSounds.prototype;
	
	p.addButton = function(button)
	{
		if(!button) return;
		
		var add;
		if(Array.isArray(button))
		{
			var arr = button;
			for(var i = arr.length - 1; i >= 0; --i)
			{
				button = arr[i];
				if(!button) continue;
				//EaselJS or Pixi
				add = button.addEventListener ? "addEventListener" : "on";
				if(this.downAlias)
					button[add]("buttonPress", this.onDown);
				if(this.overAlias)
					button[add]("buttonOver", this.onOver);
				
				this._addedButtons.push(button);
			}
		}
		else
		{
			//EaselJS or Pixi
			add = button.addEventListener ? "addEventListener" : "on";
			if(this.downAlias)
				button[add]("buttonPress", this.onDown);
			if(this.overAlias)
				button[add]("buttonOver", this.onOver);
			
			this._addedButtons.push(button);
		}
	};
	
	p.onOver = function()
	{
		Application.instance.sound.play(this.overAlias);
	};
	
	p.onDown = function()
	{
		Application.instance.sound.play(this.downAlias);
	};
	
	p.removeButton = function(button)
	{
		if(!button) return;
		
		if(Array.isArray(button))
		{
			var arr = button;
			for(var i = arr.length - 1; i >= 0; --i)
			{
				button = arr[i];
				if(!button) continue;
				
				if(this.downAlias)
					button.off("buttonPress", this.onDown);
				if(this.overAlias)
					button.off("buttonOver", this.onOver);
				
				if(this._addedButtons.indexOf(button) >= 0)
					this._addedButtons.splice(this._addedButtons.indexOf(button), 1);
			}
		}
		else
		{
			if(this.downAlias)
				button.off("buttonPress", this.onDown);
			if(this.overAlias)
				button.off("buttonOver", this.onOver);
			
			if(this._addedButtons.indexOf(button) >= 0)
				this._addedButtons.splice(this._addedButtons.indexOf(button), 1);
		}
	};
	
	p.destroy = function()
	{
		if(!this._addedButtons) return;
		
		for(var i = this._addedButtons.length - 1; i >= 0; --i)
		{
			var button = this._addedButtons[i];
			//EaselJS and Pixi both have 'off'
			if(this.downAlias)
				button.off("buttonPress", this.onDown);
			if(this.overAlias)
				button.off("buttonOver", this.onOver);
		}
		this._addedButtons = this.onDown = this.onOver = null;
	};
	
	namespace('springroll').ButtonSounds = ButtonSounds;
}());