/*utilidades para validación de datos usados en la app, en el carrito, checkout
  las funciones devuelven booleanos*/

//convierte la cantidad del producto a Number y verifica que sea un entero y mayor a 0
//retorna true para entradas como 1, '2', 3.0 y false para 0, -1, 1.5, 'abc', '', null
export function isPositiveInteger(value) {
  //con Number se normaliza cadenas numéricas a números como tal. Ej: Number('2') = 2, Number('') = 0
  const n = Number(value);
  //verifica que n sea un entero (no NaN, no decimal) y n > 0 asegura que sea un valor positivo
  return Number.isInteger(n) && n > 0;
}

//similar a isPositiveInteger pero permite el 0 (cuando sea 0 significará eliminar del carrito)
//retorna true para 0, 1, '5' ; false para -1, 1.2, 'abc'
export function isNonNegativeInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
}

//valida que la cadena tiene formato "algo@algo.algo" sin espacios en blanco
export function isEmail(value) {
  //si no existe o no es string, no es un email válido
  if (!value || typeof value !== 'string') return false;
  //trim se usa para evitar falsos negativos por espacios alrededor
  return /^\S+@\S+\.\S+$/.test(value.trim());
}
