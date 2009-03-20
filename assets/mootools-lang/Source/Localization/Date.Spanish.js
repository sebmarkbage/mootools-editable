/*
Script: Date.Spanish.US.js
	Date messages for Spanish.

	License:
		MIT-style license.

	Authors:
		Ãlfons Sanchez

*/

MooTools.lang.set('es-ES', 'Date', {

	months: function(i){
		return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i]
	},
	days: function(i) {
		return ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][i];
	},
	//culture's date order: MM/DD/YYYY
	dateOrder: ['date', 'month', 'year', '/'],
	AM: 'AM',
	PM: 'PM',

	/* Date.Extras */
	ordinal: '',

	lessThanMinuteAgo: 'hace menos de un minuto',
	minuteAgo: 'hace un minuto',
	minutesAgo: 'hace {delta} minutos',
	hourAgo: 'hace una hora',
	hoursAgo: 'hace unas {delta} horas',
	dayAgo: 'hace un dia',
	daysAgo: 'hace {delta} dias',
	lessThanMinuteUntil: 'menos de un minuto desde ahora',
	minuteUntil: 'un minuto desde ahora',
	minutesUntil: '{delta} minutos desde ahora',
	hourUntil: 'una hora desde ahora',
	hoursUntil: 'unas {delta} horas desde ahora',
	dayUntil: '1 dia desde ahora',
	daysUntil: '{delta} dias desde ahora'

});