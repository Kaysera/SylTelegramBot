function generadorInsultos() {
  const comienzosPlurales = ['abraza', 'bebe', 'caga', 'chupa', 'come', 'lame', 'masca', 'pela']
  const comienzosSingulares = ['boca', 'cabeza']
  const finalesPlurales = ['bordillos', 'farolas', 'montañas', 'ovejas', 'cables', 'chapas', 'pijas', 'patatas', 'vainas', 'higos', 'platanos', 'salmones', 'charcos']
  const finalesSingulares = ['chancla', 'berza', 'mono', 'buzon', 'pelota', 'llanta', 'llama', 'buque', 'vaca', /*y*/ 'pollo', 'charco', 'farola', 'bordillo', 'pija']
  const singular = Math.random() >0.7;
  if(singular) {
    const comienzo = comienzosSingulares[Math.floor(Math.random()*comienzosSingulares.length)];
    const final = finalesSingulares[Math.floor(Math.random()*finalesSingulares.length)];
    return comienzo+final
  } else {
    const comienzo = comienzosPlurales[Math.floor(Math.random()*comienzosPlurales.length)];
    const final = finalesPlurales[Math.floor(Math.random()*finalesPlurales.length)];
    return comienzo+final;
  }
}


module.exports = generadorInsultos
