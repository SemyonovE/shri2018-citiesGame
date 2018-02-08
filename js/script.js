window.onload = function () {

  var timerField    = document.querySelector( '.timerDiv' ),
      title         = document.querySelector( '.titleResponse' ),
      titleSpan     = document.querySelector( '.titleSpan' ),
      cityField     = document.querySelector( '.userCity' ),
      button        = document.querySelector( '.citySender' ),
      mapUserDiv    = document.querySelector( '#mapUser' ),
      mapPCDiv      = document.querySelector( '#mapPC' ),
      usedCitiesDiv = document.querySelector( '#usedCities' ),

      roundDuration = 60,
      timerPlay     = null,
      timerValue    = 0,

      currentCityList = [],
      usedCityList = [],
      someCities = [],
      pcCity = "";

//Загрузка базы городов с сервера
  getFile();
  function getFile() {
    var xhr = new XMLHttpRequest();

    /*
    Запрашиваем города одним асинхронным запросом,
    чтобы не перенагружать сервер множеством запросов
    */

    xhr.open( "GET", "cities.txt", true );

    xhr.onreadystatechange = function () {
      if( xhr.readyState != 4 ) return;

      if( xhr.status != 200 ) {
        alert( "Ошибка связи с сервером! " + xhr.status + ": " + xhr.statusText );
      }else{
        window.CITIES = xhr.responseText.split( '\n' );
        button.disabled = false;
        title.innerHTML = "Нажимай на кнопку!";
      }
    };

    xhr.send();
  }

//Проверка, запущен ли таймер с игрой, если нет, запускаем
  function initialTimer() {
    if( !timerPlay ) {
      timerPlay = setInterval(function () {
        timerField.innerHTML = --timerValue;

        if( timerValue <= 0 ) finishGame( "Время вышло!", "Ты проиграл!" );
      }, 1000);
    }
  }

//Инициализация объектов на экране и события кнопки начала игры
  buttonInitial();
  function buttonInitial() {
    button.onclick = function () {
      this.innerHTML = "Ответить";
      cityField.disabled = false;

      usedCitiesDiv.style.display = "none";

      currentCityList = window.CITIES.slice();
      usedCityList = [];

      //Генерируем первый город со стороны компьютера
      generateCityByPC( null );

      //Проверяем таймер игры
      initialTimer();

      button.onclick = function () {
        generateCityByPC( cityField.value );
      };
    };
    button.focus();
  }

//Допускаем нажатие клавиши ввод в текстовом поле для проверки города
  cityField.onkeyup = function ( e ) {
    if( e.keyCode == 13 ) generateCityByPC( cityField.value );
  };

//Окончание игры, обновление параметров объектов экрана для вывода результата
  function finishGame( spanText, titleText ) {
    //Создаем заголовки окончания игры
    titleSpan.innerHTML = spanText;
    title.innerHTML = titleText;

    //Изменяем свойства и содержимое полей для вывода результата
    cityField.value = "";
    cityField.disabled = true;
    mapUserDiv.innerHTML = "";
    mapPCDiv.innerHTML = "";
    usedCitiesDiv.style.display = "block";

    //Выводим список всех используемых городов
    var text = "<div class='left title'>Машина:</div><div class='right title'>Игрок:</div>";
    for( var i = 0; i < usedCityList.length; i++ ) {
      text += "<div class='" + ( ( i % 2 == 0 ) ? "left" : "right" ) +  "'>" + ~~(i / 2 + 1) + " " + usedCityList[i] + "</div>";
    }
    usedCitiesDiv.innerHTML = text;

    //Остановка таймера, инициализация начала игры
    button.innerHTML = "Заново";
    clearInterval( timerPlay );
    timerPlay = null;
    buttonInitial();
  }

//Подсчет количества оставшихся городов на указанную букву
  function countOfWords( latter ) {
    return currentCityList.reduce(function ( count, value ) {
      return ( value[0] == latter ) ? count + 1 : count;
    }, 0);
  }

//Определение буквы, на которую должен начинаться следующий город
  function startLatter( word ) {
    var indexLatter = word.length - 1;

    if( "йыьъё".indexOf( word[indexLatter] ) >= 0 ) {
      if( countOfWords( word[indexLatter].toUpperCase() ) == 0 ) {
        return word[indexLatter - 1].toUpperCase();
      }
    }

    return word[indexLatter].toUpperCase();
  }

//Идеализация названия города (удаление знаков, букв ё и заглавных)
  function modifyCity( city ) {
    return city.toLowerCase().replace(/ё/g, "е").replace(/[^а-я]/g, "");
  }

//Поиск города в списке
  function searchCity( array, city ) {
    for( var i = 0; i < array.length; i++ ) {
      if(modifyCity(array[i]) == city ) {
        return {flag: true, index: i};
      }
    }
    return {flag: false};
  }

//Проверка города игрока и генерацию следующего города компьютером
  function generateCityByPC( userCity ) {
    if( userCity != null ) {

      userCity = modifyCity( userCity );

      //Проверяем, ввел ли пользователь хоть что-то в поле
      if( userCity.length == 0 ) {
        titleSpan.innerHTML = "Нужно указать свой город!";
        return;
      } else if( userCity == "сдаюсь" ) {
        finishGame( "Спасибо за игру!", "Она была увлекательной!" );
        return;
      }

      //Проверяем,был ли использован город в текущей игре
      if( searchCity( usedCityList, userCity ).flag ) {
        titleSpan.innerHTML = "Этот город уже был!";
        return;
      }

      var objOfSearch = searchCity( currentCityList, userCity );

      //Если город еще не использовался, проверяем его корректность
      if( !objOfSearch.flag ) {
        titleSpan.innerHTML = "Нет такого города!";
        return;
      }

      //Определяем, на какую букву должен начинаться город игрока
      var nextLatter = startLatter( pcCity.toLowerCase() );

      //Соответствует ли предлагаемый игроком город правилам игры
      if( nextLatter != userCity[0].toUpperCase() ) {
        titleSpan.innerHTML = "Неверный город! Тебе на " + nextLatter + "!";
        return;
      }

      //Находим указанный город среди списка всех
      var indexUserCity = objOfSearch.index;

      //Отрисовываем город на карте
      geoCreate( currentCityList[indexUserCity], "mapUser" );

      //Перемещаем город из текущего списка в список используемых
      usedCityList.push( currentCityList[indexUserCity] );
      currentCityList.splice( indexUserCity, 1 );

      //Определяем на какую букву компьютер называет город
      nextLatter = startLatter( userCity );

      //Выделяем список возможных вариантов городов
      someCities = currentCityList.filter(function ( value ) {
        return value[0] == nextLatter;
      });
      titleSpan.innerHTML = "Продолжаем!";

    } else {

      //Если userCity == null, будем выбирать из всего списка
      someCities = currentCityList;
      titleSpan.innerHTML = "Игра началась!";
    }

    //Если в списке не осталось городов, компьютер проиграл
    if( someCities.length == 0 ) {
      finishGame( "Ты победил!", "У меня нет вариантов." );
      return;
    }

    //Генерируем случайный город из списка возможных и редактируем остальные списки
    var indexPCCity = currentCityList.indexOf( someCities[~~(Math.random() * someCities.length)]);
    pcCity = currentCityList[indexPCCity];
    title.innerHTML = "Мой город " + pcCity + ".";
    usedCityList.push( pcCity );
    currentCityList.splice( indexPCCity, 1 );

    //Отрисовываем город на карте
    geoCreate( pcCity, "mapPC" );

    //Если у пользователя не осталось вариантов, сообщаем ему о проигрыше
    if( countOfWords( startLatter( pcCity ) ) == 0 ) {
      finishGame( pcCity + "! Ты проиграл!", "Не осталось городов на букву " + startLatter( pcCity ) + ".");
      return;
    }

    //Делаем необходимые установки после хода компьютера
    setup();
  }

  //Некоторые установки, необходимые в начале хода игрока
    function setup() {
      timerValue = roundDuration;
      timerField.innerHTML = timerValue;

      cityField.value = "";
      cityField.focus();
    }

    window.onresize = function () {
      mapUserDiv.innerHTML = "";
      mapPCDiv.innerHTML = "";
    };
};
