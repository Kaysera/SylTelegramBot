const fetch = require("node-fetch");

class SylAnimalicos {
    constructor(botbase) {
        this.botbase = botbase
        this.addAnimalicosEndpoints(this.botbase)
    }
    addAnimalicosEndpoints(bot) {
        bot.onText(/\/animalico/, this.getAnimalico.bind(this))
        bot.onText(/\/gatete/, this.getGatete.bind(this))
        bot.onText(/\/perrete/, this.getPerrete.bind(this))
        bot.onText(/\/zorrito/, this.getZorrito.bind(this))
        bot.onText(/\/cabrita/, this.getCabrita.bind(this))
        return bot;
      }
    
      getAnimalico(msg) {
        const animalicoFunctions = [
          this.getGatete, 
          this.getPerrete, 
          this.getZorrito,
          this.getCabrita
        ]
        const randomAnimalicoFunction = animalicoFunctions[Math.floor(Math.random() * animalicoFunctions.length)].bind(this)
        randomAnimalicoFunction(msg)
      }
    
      getGatete(msg) {
        this.botbase.setChatAction(msg.chat.id, 'upload_photo')
        fetch('https://api.thecatapi.com/v1/images/search', {
          method: 'GET',
          headers: {
            'x-api-key': '6efc7324-7195-4db1-accc-328020dd0e8f'
          }
        }).then(response => response.json())
          .then(json=>{
            this.botbase.sendMessage(msg.chat.id, 'Aqui tienes tu gatete')
            this.botbase.sendPhoto(msg.chat.id, json[0].url)
          })
      }
    
      getPerrete(msg) {
        this.botbase.setChatAction(msg.chat.id, 'upload_photo')
        fetch('https://dog.ceo/api/breeds/image/random', {
          method: 'GET',
        }).then(response => response.json())
          .then(json=>{
            this.botbase.sendMessage(msg.chat.id, 'Aqui tienes tu perrete')
            this.botbase.sendPhoto(msg.chat.id, json.message)
          })
      }
    
      getZorrito(msg) {
        this.botbase.setChatAction(msg.chat.id, 'upload_photo')
        fetch('https://randomfox.ca/floof/', {
          method: 'GET',
        }).then(response => response.json())
          .then(json=>{
            this.botbase.sendMessage(msg.chat.id, 'Aqui tienes tu zorrito')
            this.botbase.sendPhoto(msg.chat.id, json.image)
          })
      }
    
      getCabrita(msg) {
        this.botbase.setChatAction(msg.chat.id, 'upload_photo')
        this.botbase.sendMessage(msg.chat.id, 'Aqui tienes tu cabrita')
        const randomNumber = Math.random()*9999999999
        this.botbase.sendPhoto(msg.chat.id, `https://placegoat.com/1000?random=${randomNumber}`)
      }
    }

    module.exports = SylAnimalicos