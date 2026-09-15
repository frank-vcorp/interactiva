# VECTORIA_PLAN_VALIDACION

version: 1.0\
nombre: Plan de Validación\
discovery: VECTORIA_DISCOVERY_INTERACTIVA.md\
fases: 6\
checklist_obligatorio: false

# Fase 1 --- Base de experiencia, acceso y navegación

## Objetivo

Entregar la experiencia base de Interactiva: portada pública atractiva,
registro y acceso mínimos, sesión única de cliente, Superusuario inicial
y navegación coherente en móvil, tablet y escritorio.

## Comprobaciones

-   La portada comunica EBC + Lobato, búsqueda, kilometraje cuando
    aplique y \$50 MXN / 30 días.
-   La acción protagonista dice "Registra tu WhatsApp".
-   No existe buscador público.
-   El registro solicita únicamente WhatsApp y contraseña.
-   No permite duplicar un WhatsApp.
-   Tras iniciar sesión el cliente entra directamente al buscador.
-   Una segunda sesión simultánea del mismo cliente es rechazada.
-   El cliente no encuentra recuperación ni cambio de contraseña.
-   El Superusuario Vectoria puede acceder con las credenciales
    iniciales definidas en Discovery y puede cambiar su propia
    contraseña.
-   No existen clientes, catálogos ni registros demo.
-   La navegación esencial funciona en móvil, tablet y escritorio.
-   La aplicación contempla instalación como PWA sin prometer
    funcionamiento offline.

## Resultado esperado

Existe una base operable y visualmente coherente de Interactiva, con
entrada pública que genera interés y acceso mínimo seguro al área
correspondiente de cliente o Superusuario.

# Fase 2 --- Catálogos, importación y trazabilidad

## Objetivo

Permitir al Superusuario incorporar y mantener ediciones reales de EBC y
Lobato sin afectar el catálogo vigente hasta decidir publicar.

## Comprobaciones

-   Puede iniciar una importación identificando EBC o Lobato.
-   El PDF original queda asociado a la importación y puede
    consultarse/descargarse administrativamente.
-   Durante procesamiento la edición vigente continúa disponible.
-   El resultado muestra fuente, edición detectada, procesados,
    advertencias, descartados y errores.
-   Los datos ambiguos no se inventan y los registros no interpretables
    no llegan a consultas de cliente.
-   Las abreviaturas solo se expanden cuando su significado es
    inequívoco.
-   Se advierten anomalías relevantes frente a la edición anterior.
-   La advertencia no bloquea por sí sola una publicación válida.
-   Una importación fallida no cambia la edición vigente.
-   Se previenen ediciones duplicadas indistinguibles.
-   Publicar una edición cambia únicamente la fuente correspondiente.
-   EBC y Lobato pueden tener ediciones vigentes de meses distintos.
-   Las ediciones sustituidas y sus PDFs permanecen conservados.
-   Una edición anterior válida puede restaurarse.
-   La restauración registra qué edición sale y cuál vuelve a estar
    vigente.
-   Existe historial simple de importaciones y restauraciones para
    Superusuario.

## Resultado esperado

El Superusuario puede mantener los dos catálogos con trazabilidad,
controles de calidad y recuperación, sin edición manual masiva ni riesgo
de sustituir accidentalmente una edición vigente durante un fallo.

# Fase 3 --- Búsqueda y experiencia vehicular

## Objetivo

Convertir los catálogos vigentes en una experiencia rápida para
encontrar el vehículo correcto y entender toda la información útil
disponible.

## Comprobaciones

-   El cliente registrado puede buscar aunque no tenga acceso pagado.
-   Existe búsqueda libre con sugerencias.
-   Existen filtros Tipo/Segmento, Marca, Modelo, Año y
    Versión/configuración.
-   Los filtros se pueden combinar y las opciones se mantienen
    compatibles con selecciones previas.
-   La consulta considera siempre EBC y Lobato sin selector de fuente.
-   Los resultados se priorizan por relevancia de identificación y no
    muestran porcentajes artificiales.
-   Al abrir y regresar de un detalle se conserva la búsqueda previa.
-   Una correspondencia inequívoca EBC/Lobato produce una ficha
    unificada.
-   Un vehículo presente en una sola fuente muestra únicamente esa
    fuente.
-   Una correspondencia incierta permanece separada.
-   El precio no se utiliza como prueba de identidad.
-   El detalle muestra identidad, características principales,
    características secundarias útiles y bloques por fuente/edición.
-   La procedencia de los datos permanece visible.
-   Un sistema sin catálogos, una búsqueda sin resultados y un error
    recuperable tienen mensajes y acciones comprensibles.

## Resultado esperado

Una persona puede localizar rápidamente una versión específica y
comprender su información sin recorrer los PDFs ni perder la distinción
entre EBC y Lobato.

# Fase 4 --- Valores protegidos y kilometraje

## Objetivo

Aplicar correctamente la frontera entre contenido gratuito y contenido
pagado, y habilitar ajustes de kilometraje únicamente cuando la fuente
lo sustente.

## Comprobaciones

-   Un cliente sin vigencia ve identidad y características pero ningún
    valor económico.
-   Los precios no aparecen difuminados, parciales ni aproximados.
-   Se muestra un CTA compacto de \$50 MXN / 30 días.
-   Un cliente vigente ve todos los conceptos económicos aplicables de
    las fuentes disponibles.
-   Compra, Venta, Lista, Contado u otros conceptos interpretables
    conservan su significado de origen.
-   No existe promedio EBC/Lobato ni "valor Interactiva".
-   El cliente puede capturar kilometraje desde la consulta del
    vehículo.
-   El kilometraje no se conserva como historial personal.
-   El valor original publicado siempre permanece visible.
-   Solo aparece valor ajustado cuando la fuente/edición tiene una regla
    inequívocamente aplicable.
-   Una regla de una fuente nunca se aplica a la otra.
-   Cuando no existe regla aplicable se comunica sin inventar un
    cálculo.

## Resultado esperado

La información económica está correctamente protegida y cada cálculo es
trazable a una regla válida de la fuente, preservando siempre el valor
original.

# Fase 5 --- Mercado Pago, vigencia y autoservicio

## Objetivo

Hacer autosustentable la contratación y renovación del único producto
comercial de Interactiva mediante Mercado Pago.

## Comprobaciones

-   El único producto cuesta \$50 MXN y concede exactamente 30 días.
-   Una cuenta sin vigencia inicia sus 30 días al confirmarse el pago.
-   Una cuenta vigente agrega 30 días al vencimiento existente.
-   Una cuenta vencida inicia nueva vigencia desde la confirmación.
-   Tarjeta ofrece renovación automática activa por defecto.
-   El cliente puede desactivar y, cuando sea compatible, reactivar
    renovación automática.
-   Desactivar renovación no elimina días pagados.
-   Un pago manual anticipado acumula días.
-   Si había renovación automática, la siguiente renovación se desplaza
    al nuevo vencimiento.
-   OXXO no concede acceso hasta confirmación de Mercado Pago.
-   Una referencia OXXO vencida/no pagada no agrega días.
-   No existe carga manual de comprobantes.
-   Al vencer sin pago confirmado el cliente conserva cuenta y búsqueda
    gratuita, pero pierde valores/cálculos.
-   Un fallo de renovación automática no se interpreta como pago.
-   Si Mercado Pago está sin configurar o no disponible, no se simulan
    pagos ni se conceden días.
-   Los clientes ya vigentes conservan sus días ante una caída de
    Mercado Pago.
-   No existe módulo de reembolsos ni historial de pagos para clientes.
-   Cuenta muestra WhatsApp, estado, vencimiento, renovación automática
    y acciones de pago/renovación aplicables.

## Resultado esperado

Un cliente puede contratar, renovar, acumular vigencia y administrar la
renovación sin intervención manual de VectorIA, y ningún fallo externo
concede acceso ficticio.

# Fase 6 --- Administración mínima y cierre integral

## Objetivo

Completar la operación del Superusuario y validar el recorrido extremo a
extremo de Interactiva sin añadir administración innecesaria.

## Comprobaciones

-   Superusuario puede buscar clientes por WhatsApp.
-   El detalle muestra WhatsApp, estado de acceso, vencimiento y
    renovación automática cuando aplique.
-   No puede otorgar días, bloquear clientes, eliminar cuentas ni ver
    contraseñas o datos sensibles de pago.
-   Mercado Pago puede configurarse desde el producto por el
    Superusuario.
-   Las credenciales se muestran protegidas y no aparecen en
    logs/mensajes visibles.
-   Configuración distingue disponible, faltante y no disponible.
-   Las acciones dependientes de una integración faltante quedan
    desactivadas o advierten claramente.
-   Los errores críticos de importación, pago y búsqueda tienen
    recuperación comprensible.
-   No existe IA, CRM, tickets, dashboard decorativo, historial de
    cliente, selector de fuente ni funciones fuera de alcance.
-   Los recorridos completos funcionan en móvil, tablet y escritorio.
-   Se validan todos los criterios de aceptación globales del Discovery.
-   Antes de producción comercial, el operador confirma los
    derechos/licencias necesarios para el uso comercial de la
    información de EBC y Lobato.

## Resultado esperado

Interactiva queda funcionalmente completa para V1, operable por cliente
y Superusuario, sin dependencias simuladas ni funcionalidades fuera del
alcance acordado.
