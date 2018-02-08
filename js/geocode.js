function geoCreate( city, id ) {
  //Очищаем элемент
  document.getElementById( id ).innerHTML = "";

  //Создаем карту, находя координаты центра по названию города
  ymaps.geocode( city, { results: 1 } ).then(function ( res ) {
    var firstGeoObject = res.geoObjects.get( 0 ),

        myMap = new ymaps.Map(id, {
          center: firstGeoObject.geometry.getCoordinates(),
          zoom: 12,
          behaviors: ['drag', 'scrollZoom'],
        });

    myMap.container.fitToViewport();

  }, function ( err ) {
    alert( err.message );
  });
}
