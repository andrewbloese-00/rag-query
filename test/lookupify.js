
    const Abbreviations = [
        "a.m","p.m","etc","vol","inc","jr","dr","tex","co","prof","rev","revd","hon","v.s","ie",
		"eg","et al","st","ph.d","capt","mr","mrs","ms"
    ]



	function lookupify(strArray){
		let lookup = {} 
		for(let i = 0; i < strArray.length; i++){
			lookup[strArray[i]] = true;
		}
		return lookup
	}

	console.log(lookupify(Abbreviations));
