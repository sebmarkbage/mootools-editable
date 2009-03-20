UnitTester.site = 'Editable';
UnitTester.title = 'Unit Tests';

window.addEvent('load', function(){
	var sources = {
		mootoolsCore: '../assets/mootools-core',
		mootoolsMore: '../assets/mootools-more'
	};

	new UnitTester(sources, {
		'mootools-editable': 'UserTests/'
	}, {
		autoplay: true
	});
});
