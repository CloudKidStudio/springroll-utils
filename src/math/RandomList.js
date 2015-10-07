(function()
{
	var Debug = include("springroll.Debug", false);

	var RandomList = function(list)
	{
		if (!Array.isArray(list) && Debug)
		{
			Debug.error("Error: Attempting to make a RandomList without a list", list);
		}

		this.list = list.slice().shuffle();
		this.used = [];
	};

	var p = RandomList.prototype = {};

	/**
	 * get a random value from the source Array
	 * @return {*} Value from the array
	 */
	p.random = function()
	{
		var r = this.list.pop();
		this.used.push(r);
		if (this.list.length < 1)
		{
			for (var i = this.used.length - 1; i >= 0; --i)
			{
				this.list.push(this.used[i]);
			}
			this.list.shuffle();
			this.used.length = 0;
		}
		return r;
	};
	
	/**
	 * Clean up and don't use after this
	 */
	p.destroy = function()
	{
		this.list = this.used = null;
	};

	//Assign to namespace
	namespace('springroll').RandomList = RandomList;
}());