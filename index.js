const express = require('express');
const { engine } = require('express-handlebars');
const { neon } = require('@neondatabase/serverless'); 

const app = express();  
const port = 3000;

const sql = neon('postgresql://neondb_owner:NDKXgo1Jb3im@ep-royal-fog-a5bg8fuy.us-east-2.aws.neon.tech/neondb?sslmode=require');
app.use(express.urlencoded({ extended: true }));


app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.render('home', { title: 'Página Principal' });
});

app.get('/personal', (req, res) => {
  res.render('personal', { title: 'Personal' });
});

app.get('/productos', (req, res) => {
  res.render('productos', { title: 'Productos' });
});

app.get('/pallets', (req, res) => {
  res.render('pallets', { title: 'Pallets' });
});

app.get('/pedido', (req, res) => {
  res.render('pedido', { title: 'Consulta de Pedido' });
});
app.get('/pickeador', async (req, res) => { 
  const { id_pickeador, fecha_inicio, fecha_fin } = req.query;

  try {

    const result = await sql`
      SELECT p.id_pedido, p.fecha_pedido 
      FROM pedido p
      WHERE p.id_pickeador = ${id_pickeador}
      AND p.fecha_pedido BETWEEN ${fecha_inicio} AND ${fecha_fin}
      ORDER BY p.fecha_pedido;
    `;

    res.render('pickeador', {
      title: 'Pedidos por Pickeador',
      pedidos: result,
    });
  } catch (error) {
    console.error('Error al buscar pedidos:', error);
    res.status(500).send('Error al buscar pedidos');
  }
});


app.post('/pedido', async (req, res) => {
  const { id_pedido } = req.body;
  
  try {

    const resultPedido = await sql`
      SELECT id_pedido
      FROM pedido
      WHERE id_pedido = ${id_pedido};
    `;
    
    if (resultPedido.length > 0) {
      res.render('pedido', {
        title: 'Detalle del Pedido',
        pedido: { id_pedido: resultPedido[0].id_pedido }
      });
    } else {
      res.render('pedido', {
        title: 'Detalle del Pedido',
        error: 'No se encontró el pedido.'
      });
    }
  } catch (error) {
    console.error(error);
    res.render('pedido', {
      title: 'Detalle del Pedido',
      error: 'Hubo un error al consultar los datos.'
    });
  }
});
app.post('/pedido/consulta', async (req, res) => {
  const { id_pedido } = req.body;

  try {

    const resultPedido = await sql`
      SELECT id_pedido FROM pedido WHERE id_pedido = ${id_pedido};
    `;
    
    if (resultPedido.length > 0) {

      res.render('pedido', {
        title: 'Consulta de Pedido',
        id_pedido: id_pedido
      });
    } else {

      res.render('pedido', {
        title: 'Consulta de Pedido',
        error: 'No se encontró el pedido con ese ID.'
      });
    }
  } catch (error) {
    console.error(error);
    res.render('pedido', {
      title: 'Consulta de Pedido',
      error: 'Hubo un error al procesar la consulta.'
    });
  }
});


app.post('/pedido/detalle', async (req, res) => {
  const { id_pedido } = req.body;

  try {

    const resultDetalle = await sql`
      SELECT dp.id_producto, pr.nombre, dp.cantidad
      FROM detalle_pedido dp
      JOIN producto pr ON dp.id_producto = pr.id_producto
      WHERE dp.id_pedido = ${id_pedido};
    `;

    if (resultDetalle.length > 0) {
      res.render('pedido', {
        title: 'Detalle del Pedido',
        detalle: resultDetalle,
        id_pedido: id_pedido
      });
    } else {
      res.render('pedido', {
        title: 'Detalle del Pedido',
        error: 'Este pedido no tiene productos asignados.',
        id_pedido: id_pedido
      });
    }
  } catch (error) {
    console.error(error);
    res.render('pedido', {
      title: 'Detalle del Pedido',
      error: 'Hubo un error al consultar el detalle.',
      id_pedido: id_pedido
    });
  }
});

app.post('/pedido/direccion', async (req, res) => {
  const { id_pedido } = req.body;

  try {

    const resultDireccion = await sql`
      SELECT p.id_pedido, d.direccion
      FROM pedido p
      JOIN despacho d ON p.id_pedido = d.id_despacho
      WHERE p.id_pedido = ${id_pedido};
    `;

    if (resultDireccion.length > 0) {
      res.render('pedido', {
        title: 'Dirección del Pedido',
        direccion: resultDireccion[0].direccion,
        id_pedido: id_pedido
      });
    } else {
      res.render('pedido', {
        title: 'Dirección del Pedido',
        error: 'No se encontró la dirección para este pedido.',
        id_pedido: id_pedido
      });
    }
  } catch (error) {
    console.error(error);
    res.render('pedido', {
      title: 'Dirección del Pedido',
      error: 'Hubo un error al consultar la dirección.',
      id_pedido: id_pedido
    });
  }
});
app.get('/ubicacion', async (req, res) => {
  try {

    const result = await sql`
      SELECT p.nombre AS producto, u.ubicacion
      FROM producto p
      JOIN producto_ubicacion pu ON p.id_producto = pu.id_producto
      JOIN ubicacion u ON pu.id_ubicacion = u.id_ubicacion
      ORDER BY p.nombre, u.ubicacion;
    `;


    if (result.length === 0) {
      return res.status(404).send('No se encontraron ubicaciones para los productos.');
    }


    res.render('ubicacion',{
      title: 'Ubicaciones de Productos',
      ubicaciones: result,
    });
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).send('Error al obtener ubicaciones.');
  }
});
app.get('/suma', async (req, res) => {
  try {

    const result = await sql`SELECT SUM(stock) AS total_stock FROM producto`;


    res.render('suma', {
      title: 'Suma Total de Stock',
      totalStock: result[0].total_stock
    });
  } catch (error) {
    console.error('Error al obtener el total del stock:', error);
    res.status(500).send('Error en el servidor');
  }
});


app.get('/stock', async (req, res) => {

  const productos = await sql`
    SELECT nombre, SUM(stock) AS stock
    FROM producto
    GROUP BY nombre
  `;

  res.render('stock', { title: 'Stock de productos', productos });
});
app.get('/pallets', (req, res) => {
  res.render('pallets', { title: 'Consulta de Pallets' });
});

app.get('/productoxpallet', async (req, res) => {
  const { id_pallet } = req.query;

  console.log('ID del Pallet recibido en /productoxpallet:', id_pallet);

  if (!id_pallet) {
    return res.render('productoxpallet', {
      title: 'Productos en Pallet',
      palletData: [],
      id_pallet: '',
    });
  }

  try {

    const palletData = await sql`
      SELECT p.nombre AS producto, ge.cantidad_a_guardar AS stock, u.ubicacion 
      FROM producto p
      JOIN guardado_en ge ON p.id_producto = ge.id_producto
      JOIN pallet pa ON pa.id_pallet = ge.id_pallet
      JOIN guardar_pallet gp ON pa.id_pallet = gp.id_pallet
      JOIN ubicacion u ON gp.id_ubicacion = u.id_ubicacion
      WHERE pa.id_pallet = ${id_pallet}
    `;

    console.log('Datos del pallet:', palletData);

    if (palletData.length === 0) {
      return res.render('productoxpallet', {
        title: 'Productos en Pallet',
        palletData: [],
        id_pallet,
      });
    }

    res.render('productoxpallet', {
      title: `Productos en Pallet - ID: ${id_pallet}`,
      palletData,
      id_pallet,
    });
  } catch (error) {
    console.error('Error al obtener los productos y ubicaciones:', error);
    res.status(500).send('Hubo un error al obtener la información del pallet.');
  }
});






app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});