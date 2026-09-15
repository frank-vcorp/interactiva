# VECTORIA_DISCOVERY --- Interactiva

**Versión:** 1.0\
**Estado:** Cerrado funcionalmente para V1\
**Proyecto:** Interactiva\
**Repositorio oficial:** https://github.com/frank-vcorp/interactiva\
**Zona horaria operativa:** America/Mexico_City\
**Documento de validación asociado:** `VECTORIA_PLAN_VALIDACION.md`

------------------------------------------------------------------------

## 1. Objetivo

Interactiva es un servicio web/PWA de pago que convierte los catálogos
automotrices EBC y Lobato, originalmente distribuidos como PDFs
extensos, en información estructurada, buscable, filtrable y fácil de
consultar.

El valor principal del producto es reducir el recorrido:

**PDF complejo → búsqueda sencilla → vehículo exacto → información
completa → valores por fuente → ajuste por kilometraje cuando
corresponda.**

La V1 debe ser pequeña, autosustentable y especialmente limpia en móvil.
No debe depender de operación manual de VectorIA para registros, pagos,
activaciones, vencimientos o renovaciones ordinarias.

------------------------------------------------------------------------

## 2. Principios funcionales

1.  EBC y Lobato son fuentes independientes. Sus metodologías, conceptos
    y valores no se consideran equivalentes salvo que el propio
    contenido permita afirmarlo.
2.  Nunca se promedian, mezclan o sustituyen valores entre fuentes.
3.  Nunca se inventan vehículos, versiones, atributos, abreviaturas,
    precios ni reglas de kilometraje.
4.  Cuando la correspondencia EBC ↔ Lobato no sea suficientemente
    inequívoca, los registros permanecen separados.
5.  El cliente consulta únicamente las ediciones vigentes de cada
    fuente.
6.  Las ediciones anteriores se conservan para trazabilidad y
    restauración administrativa.
7.  La V1 no requiere ningún modelo de IA.
8.  La interfaz debe priorizar velocidad de operación y comprensión
    sobre decoración.
9.  El sistema inicia sin clientes, catálogos ni datos de demostración.
    El único acceso inicial predefinido es el Superusuario indicado en
    este documento.

------------------------------------------------------------------------

## 3. Usuarios y permisos

### 3.1 Cliente

Puede: - registrarse con WhatsApp y contraseña; - iniciar sesión; -
buscar y filtrar vehículos aun sin acceso pagado; - consultar identidad
y características no económicas; - contratar o renovar acceso; -
consultar valores y cálculos de kilometraje mientras tenga acceso
vigente; - gestionar la renovación automática cuando corresponda.

No puede: - importar o publicar catálogos; - consultar ediciones
históricas; - ver valores protegidos sin vigencia; - ver historial de
pagos; - recuperar o cambiar contraseña en V1; - eliminar su cuenta en
V1.

### 3.2 Superusuario

Existe un único perfil administrativo en V1: Superusuario.

Acceso inicial: - **Usuario:** Vectoria - **Contraseña inicial:**
VectorIA2026@

Tiene acceso total a las funciones administrativas de V1. La contraseña
inicial no debe volver a mostrarse posteriormente en interfaces, logs o
mensajes. El Superusuario sí debe poder cambiar su propia contraseña
posteriormente.

Puede: - consultar clientes por WhatsApp; - consultar su estado de
acceso y renovación; - importar EBC y Lobato; - revisar resultados de
importación; - publicar una edición; - consultar ediciones e
importaciones anteriores; - restaurar una edición anterior válida; -
consultar el PDF original de una importación; - administrar la
configuración de Mercado Pago.

No puede en V1: - regalar o extender días manualmente; -
bloquear/desactivar clientes; - modificar contraseñas de clientes; -
realizar reembolsos desde Interactiva; - editar masivamente registros
extraídos.

------------------------------------------------------------------------

## 4. Mapa funcional

### Área pública

1.  Portada
2.  Registro / acceso

### Área cliente

3.  Buscar vehículos
4.  Detalle del vehículo, incluyendo cálculo por kilometraje
5.  Cuenta / suscripción

### Área Superusuario

6.  Clientes y detalle de cliente
7.  Catálogos y ediciones
8.  Importación / resultado de importación
9.  Detalle de edición/importación y restauración
10. Configuración de Mercado Pago

La experiencia del cliente debe sentirse deliberadamente pequeña:
**Buscar → Vehículo → Cuenta**.

------------------------------------------------------------------------

# 5. Módulo --- Portada pública

## Propósito

Convertir una visita en registro comunicando el valor del servicio en
pocos segundos.

## Contenido

Debe comunicar de forma breve: - consulta de información de EBC y
Lobato; - búsqueda y filtros de vehículos; - características de los
vehículos; - valores económicos para clientes con acceso; - ajuste por
kilometraje cuando la fuente tenga una regla aplicable; - precio único:
**\$50 MXN por 30 días**.

Acción principal: **"Registra tu WhatsApp"**.

Debe existir acceso discreto para clientes ya registrados.

## Restricciones

-   No existe búsqueda pública.
-   No se muestran vehículos ni valores antes del registro.
-   No hay testimonios ficticios, contadores, planes comparativos, blog,
    demos ni estadísticas decorativas.
-   La portada debe "enganchar" visualmente y mantener una estética
    automotriz moderna, profesional, limpia y rápida.
-   Tema claro, responsive y especialmente cuidada en móvil.

------------------------------------------------------------------------

# 6. Módulo --- Registro, acceso y sesión

## Registro

Campos: - WhatsApp; - contraseña.

La interfaz utilizará el texto **"Registra tu WhatsApp"**.

Reglas: - el WhatsApp es el identificador de acceso; - debe ser único; -
no se solicita nombre, correo, domicilio ni información adicional
innecesaria; - no existe verificación OTP/SMS/WhatsApp en V1; - crear
una cuenta no concede acceso pagado.

## Acceso

El cliente inicia sesión con WhatsApp + contraseña.

Tras acceder entra directamente al buscador, no a un dashboard.

## Sesión única

Una cuenta de cliente solo puede estar activa en un dispositivo/sesión a
la vez.

Si se intenta abrir simultáneamente en otro dispositivo, el segundo
acceso se rechaza informando que la cuenta ya está en uso.

V1 no incorpora transferencia administrada de dispositivo, frecuencia de
cambios ni mecanismos avanzados anti-compartición.

## Contraseña

Cliente: - sin recuperación de contraseña; - sin cambio de contraseña; -
sin restablecimiento administrativo.

Superusuario: - puede cambiar su propia contraseña.

## Cuenta

La cuenta del cliente permanece aunque expire el acceso. No existe
eliminación de cuenta en V1.

------------------------------------------------------------------------

# 7. Módulo --- Suscripción, vigencia y Mercado Pago

## Producto comercial

Existe un único producto:

**\$50 MXN = exactamente 30 días de acceso completo.**

No existen: - planes; - tiers; - descuentos; - cupones; - compras por
catálogo; - precio o duración configurables en V1.

## Inicio y acumulación de vigencia

Un pago solo concede acceso cuando Mercado Pago lo comunica como
confirmado.

Reglas: - cuenta sin vigencia: los 30 días comienzan desde la
confirmación del pago; - cuenta vigente: se agregan 30 días a la fecha
de vencimiento existente; - cuenta vencida: los 30 días comienzan desde
la nueva confirmación; - pagar anticipadamente nunca hace perder días.

Los cálculos de vigencia usan America/Mexico_City.

## Métodos

### Tarjeta

-   renovación automática activa por defecto;
-   el cliente puede desactivarla;
-   desactivarla no elimina días ya pagados;
-   puede volver a activarla cuando exista un método compatible;
-   puede cambiar método de pago;
-   la renovación automática solo amplía vigencia cuando el pago
    correspondiente queda confirmado.

Si el cliente paga manualmente antes de vencer y tiene renovación
automática activa, los 30 días se agregan a su vigencia y la próxima
renovación automática se desplaza al nuevo vencimiento. No debe existir
un cobro automático prematuro mientras aún queden días previamente
pagados.

### OXXO

-   no se presenta como domiciliación;
-   el cliente puede generar la opción/referencia de pago disponible
    mediante Mercado Pago;
-   no existe carga manual de comprobantes;
-   la vigencia solo se amplía después de la confirmación de Mercado
    Pago;
-   una referencia vencida o no pagada no concede días;
-   posteriormente el cliente puede intentar nuevamente o elegir
    tarjeta.

## Vencimiento

Al llegar el vencimiento sin un nuevo pago confirmado: - la cuenta
permanece; - el cliente puede iniciar sesión y buscar; - pierde acceso a
valores económicos y cálculos protegidos; - puede renovar.

## Fallos de Mercado Pago

Si Mercado Pago está sin configurar, desconectado o temporalmente
indisponible: - los clientes con vigencia continúan usando su acceso
hasta el vencimiento; - no se simulan pagos; - no se conceden días; - se
impiden o advierten claramente las acciones dependientes; - el cliente
puede reintentar posteriormente.

Un fallo de renovación automática no equivale a pago. Si la vigencia
termina sin confirmación, el acceso pasa al nivel gratuito.

## Reembolsos e historial

-   Interactiva no incluye módulo de reembolsos ni controles manuales de
    devolución.
-   Los estados económicos que afecten la vigencia deben respetar la
    información comunicada por Mercado Pago y no inventarse.
-   El cliente no dispone de historial de pagos en V1.

------------------------------------------------------------------------

# 8. Módulo --- Búsqueda y filtros

## Acceso

Requiere cuenta registrada, pero no suscripción vigente.

## Entrada

Debe existir: - búsqueda libre; - sugerencias/autocompletado; - filtros
estructurados.

Filtros V1: - Tipo/Segmento; - Marca; - Modelo; - Año; -
Versión/configuración.

Los filtros pueden combinarse con búsqueda libre y deben ser
contextuales: las opciones disponibles se reducen a combinaciones
compatibles con la selección actual.

No se crea un filtro para cada atributo extraído.

## Sugerencias

Se generan a partir de los catálogos vigentes y pueden orientar por: -
marca; - modelo; - año; - versión; - combinaciones útiles.

## Fuentes

Cada consulta considera siempre simultáneamente: - edición vigente de
EBC; - edición vigente de Lobato.

No existe selector EBC/Lobato/Todos.

## Orden

Los resultados se ordenan principalmente por cercanía/relevancia
respecto a la intención de búsqueda, respetando primero las
restricciones exactas de los filtros.

No se muestran porcentajes artificiales de coincidencia.

## Resultados

Cada resultado debe permitir distinguir suficientemente el vehículo
mediante su identidad y características relevantes.

Posibles situaciones: - vehículo relacionado con ambas fuentes; -
vehículo presente solo en EBC; - vehículo presente solo en Lobato; -
registros separados porque la correspondencia entre fuentes es incierta.

Al regresar desde el detalle, la búsqueda y filtros previos se
conservan.

## Estados

Debe contemplarse: - sistema sin catálogos publicados; - búsqueda
vacía; - búsqueda en proceso; - resultados; - sin coincidencias; - error
recuperable.

------------------------------------------------------------------------

# 9. Módulo --- Vehículo y correspondencia EBC ↔ Lobato

## Identidad funcional

La información aprovechable puede incluir, cuando la fuente la publique
de forma interpretable: - tipo/categoría/segmento; - marca; - modelo o
familia; - año; - versión/configuración; - motor/motorización; -
transmisión; - carrocería; - puertas; - tracción; - combustible o
tecnología; - características/equipamiento; - otros atributos útiles de
la fuente.

No se obliga a EBC y Lobato a compartir exactamente el mismo conjunto de
atributos.

## Correspondencia entre fuentes

Dos registros se presentan como un mismo vehículo únicamente cuando su
identidad comercial sea suficientemente inequívoca.

La evaluación utiliza los atributos diferenciadores disponibles. No
exige textos literalmente idénticos: diferencias de mayúsculas,
puntuación o abreviaturas inequívocas no impiden una correspondencia.

Impiden fusionar: - contradicción en atributos que cambian la identidad
de la versión; - una descripción genérica que podría corresponder a
varias versiones de la otra fuente; - ausencia de información suficiente
para elegir una versión con certeza.

El precio nunca es prueba de identidad.

Resultados posibles: 1. **Correspondencia confirmada:** una ficha con
bloques EBC y Lobato. 2. **Solo una fuente:** una ficha con la fuente
disponible. 3. **Correspondencia incierta:** registros separados.

No existe "coincidencia probable" presentada al cliente como certeza.

------------------------------------------------------------------------

# 10. Módulo --- Detalle del vehículo

## Navegación

Tocar un resultado abre una vista completa de detalle.

## Distribución funcional

### Identificación

-   marca;
-   modelo/familia;
-   año;
-   versión/configuración;
-   tipo/segmento cuando aporte contexto.

### Características

Primero se muestran las características principales para reconocer la
versión. La información secundaria confiable puede agruparse en "Más
características".

La intención es aprovechar toda la información útil del catálogo sin
convertir la cabecera en una pared de datos.

### Información por fuente

Bloques separados: - **EBC --- edición vigente** - **Lobato --- edición
vigente**

Cada bloque conserva: - procedencia; - edición; - conceptos económicos
originales; - características específicas de esa fuente cuando sean
útiles.

Conceptos como Compra, Venta, Lista o Contado permanecen diferenciados
cuando la fuente los publique con esos significados. No se transforman
en un único "Precio".

No se: - promedian fuentes; - elige un "mejor precio"; - genera un
"valor Interactiva"; - rellena un valor ausente; - traslada un concepto
de una fuente a otra.

## Acceso gratuito

Cliente registrado sin vigencia: - ve identidad; - ve características no
económicas; - puede saber que existen valores; - no ve valores
parciales, aproximados, difuminados ni cálculos; - recibe CTA compacto
**"\$50 MXN / 30 días"**.

Cliente vigente: - ve la información económica completa de las fuentes
disponibles; - puede usar cálculo por kilometraje cuando corresponda.

------------------------------------------------------------------------

# 11. Módulo --- Kilometraje

## Entrada

El cliente puede capturar el kilometraje actual desde el detalle del
vehículo.

El kilometraje: - aplica únicamente a la consulta actual; - no se guarda
como dato personal; - no crea garage, favorito ni historial.

## Regla

Siempre se conserva visible el valor original publicado.

Solo se muestra un valor ajustado cuando la fuente y edición
proporcionen una regla, tabla o ecuación aplicable que pueda
interpretarse con suficiente certeza.

No se permite: - inventar fórmulas; - extrapolar reglas no soportadas; -
aplicar una regla Lobato a EBC; - aplicar una regla EBC a Lobato; -
presentar un cálculo incierto como válido.

Si una fuente no tiene regla aplicable, se indica de manera sencilla que
esa edición no proporciona un ajuste aplicable para ese vehículo.

## Presentación

Debe diferenciar claramente: - valor publicado; - kilometraje
introducido; - valor ajustado calculado; - fuente/edición responsable de
la regla.

------------------------------------------------------------------------

# 12. Módulo --- Importador de catálogos

## Propósito

Permitir que el Superusuario mantenga EBC y Lobato actualizados sin
intervención operativa rutinaria de desarrollo.

No es un importador universal de PDFs. Funcionalmente reconoce dos
fuentes: - EBC; - Lobato.

## Flujo

**Seleccionar fuente → cargar PDF → procesar → revisar resultado →
publicar o no publicar.**

Durante procesamiento, la edición vigente continúa operando sin cambios.

## Resultado de importación

Debe mostrar: - fuente; - edición detectada; - estado; - cantidad de
registros interpretados; - advertencias; - cantidad de registros
descartados/no interpretables; - errores relevantes; - anomalías
respecto a la edición anterior; - PDF original asociado.

No se requiere aprobación vehículo por vehículo.

## Interpretación

El objetivo es extraer toda información útil y confiablemente
interpretable.

Si una edición introduce un atributo nuevo que puede interpretarse con
certeza, se conserva aunque no existiera en la edición anterior.

Las abreviaturas: - pueden mostrarse expandidas si su significado está
definido inequívocamente por la fuente; - conservan su procedencia; - si
son ambiguas, no se adivinan.

Los registros que no puedan interpretarse con suficiente certeza: - no
participan en consultas de clientes; - aparecen contabilizados como
descartados/no interpretables; - no se completan por inferencia.

## Control de calidad comparativo

Antes de publicar, se advierten cambios anormales frente a la edición
anterior de la misma fuente, por ejemplo: - caída considerable de
registros interpretados; - aumento anormal de descartados; -
desaparición importante de marcas/modelos; - otras variaciones globales
que sugieran cambio de formato o extracción problemática.

La advertencia explica qué cambió y su magnitud.

No bloquea automáticamente la publicación: un catálogo puede cambiar
legítimamente. El Superusuario toma la decisión final.

Un archivo que no pueda procesarse queda fallido y nunca altera la
edición vigente.

## Duplicados

Debe prevenirse la creación/publicación inadvertida de una edición
indistinguible ya importada de la misma fuente. El Superusuario debe
recibir una advertencia o impedimento claro en lugar de terminar con
duplicados operativos.

## Edición vigente

EBC y Lobato tienen vigencia independiente.

Ejemplo válido: - EBC Septiembre 2026 vigente; - Lobato Agosto 2026
vigente.

Al publicar: - la nueva edición se convierte en vigente para esa
fuente; - la anterior deja inmediatamente de participar en búsquedas,
valores y cálculos; - la edición anterior y su PDF no se eliminan.

## Restauración

El Superusuario puede restaurar una edición anterior válida de la misma
fuente.

Debe existir confirmación clara indicando qué edición dejará de ser
vigente y cuál será restaurada.

La edición desplazada permanece conservada.

## Estados funcionales

-   Cargada
-   Procesando
-   Procesada / lista para revisión
-   Publicada / vigente
-   Sustituida
-   Fallida

Una edición sustituida puede volver a vigente mediante restauración.

## Reintento

Una importación fallida puede reintentarse/reimportarse sin afectar la
edición vigente.

No se crea un editor masivo de datos extraídos en V1. Los problemas
relevantes deben resolverse corrigiendo la importación y volviendo a
procesar la fuente.

------------------------------------------------------------------------

# 13. Procedencia, historial y archivos

## Procedencia

Todo dato vehicular consultable debe poder atribuirse a: - EBC o
Lobato; - edición concreta; - registro importado correspondiente.

Un cambio de edición no modifica retrospectivamente una edición
anterior.

## PDF original

Cada importación conserva su PDF original como archivo de trazabilidad.

Pertenece a la importación/edición correspondiente y el Superusuario
puede consultarlo/descargarlo desde el detalle administrativo.

No es visible para clientes.

## Historial simple de importaciones

Restringido al Superusuario.

Registra funcionalmente: - cuándo se cargó; - fuente; - edición; -
resultado; - cantidades procesadas/advertidas/descartadas; - errores
relevantes; - publicación y momento de publicación; - restauraciones
relevantes; - PDF original.

No se convierte en bitácora técnica general.

------------------------------------------------------------------------

# 14. Módulo --- Administración de clientes

## Listado

Superusuario puede buscar clientes por WhatsApp.

## Detalle

Muestra: - WhatsApp; - estado de acceso: sin acceso / vigente /
vencido; - fecha y hora exacta de vencimiento cuando corresponda; -
estado de renovación automática cuando aplique.

## Restricciones

No existe: - CRM; - notas; - seguimiento comercial; - modificación
manual de vigencia; - cortesías; - bloqueo/desactivación; -
eliminación; - visualización de contraseña; - visualización de datos
sensibles del medio de pago; - historial de pagos del cliente.

------------------------------------------------------------------------

# 15. Módulo --- Configuración

## Mercado Pago

Solo Superusuario.

Debe permitir administrar la configuración funcional necesaria para
conectar Mercado Pago y conocer su estado.

Los valores sensibles: - se muestran protegidos; - no aparecen en logs o
mensajes operativos; - no son visibles para clientes.

Estados comprensibles: - configurado/disponible; - configuración
faltante; - no disponible/error de conexión.

Cuando falte configuración: - no se simulan pagos; - las acciones
dependientes se desactivan o advierten claramente; - debe existir ruta
clara hacia Configuración para el Superusuario.

## Integraciones no requeridas

V1 no incorpora: - IA; - SendGrid, salvo que posteriormente aparezca una
necesidad funcional de correo; - Facturapi, salvo que posteriormente se
defina facturación electrónica; - Baileys/WhatsApp operativo: el
WhatsApp del cliente es únicamente identificador capturado en V1, no un
canal verificado ni una integración de mensajería.

------------------------------------------------------------------------

# 16. Diseño y experiencia

Nombre visible: **Interactiva**.

## Dirección

-   moderna;
-   profesional;
-   SaaS;
-   automotriz;
-   limpia;
-   sobria;
-   rápida;
-   tema claro;
-   excelente experiencia móvil.

La portada debe generar interés desde el primer contacto, pero la
calidad visual debe continuar en búsqueda y detalle.

## Responsive y PWA

Debe operar correctamente en: - escritorio; - tablet; - móvil.

Debe contemplarse como PWA instalable.

No se requiere funcionamiento offline.

## Evitar

-   dashboards decorativos;
-   exceso de tarjetas;
-   gradientes excesivos;
-   animaciones innecesarias;
-   navegación profunda;
-   elementos que oculten o ralenticen la consulta.

------------------------------------------------------------------------

# 17. Estados y errores transversales

Las funciones relevantes deben comunicar de forma comprensible: - estado
vacío; - procesamiento; - éxito; - error recuperable; - error externo; -
integración desconectada; - configuración faltante; - posibilidad de
reintentar.

Reglas críticas: - un error de importación no afecta el catálogo
vigente; - un error de pago no concede acceso; - un error de Mercado
Pago no retira anticipadamente días ya confirmados; - un dato ambiguo no
se inventa; - un vehículo ambiguamente relacionado no se fusiona.

------------------------------------------------------------------------

# 18. Entidades funcionales y relaciones

## Cliente

Se registra con WhatsApp. Puede tener acceso vigente o no. Busca
vehículos y gestiona su suscripción.

## Acceso/Vigencia

Representa el derecho temporal a consultar contenido protegido. Nace o
se extiende exclusivamente a partir de pagos confirmados. Expira
automáticamente.

## Operación de pago

Se origina en Mercado Pago y puede afectar vigencia solo cuando su
estado confirmado lo justifica. No se edita manualmente desde
Interactiva.

## Fuente de catálogo

EBC o Lobato.

## Edición

Pertenece a una fuente. Puede ser vigente, sustituida u otros estados de
importación. Conserva su contenido y PDF original.

## Importación

Es el proceso/resultado de incorporar un PDF de una fuente y edición.
Conserva resumen, advertencias, errores y trazabilidad.

## Registro vehicular de fuente

Información interpretada de una edición concreta. Nunca pierde su
procedencia.

## Vehículo consultable

Representación de consulta que puede relacionar registros de ambas
fuentes cuando la correspondencia sea inequívoca.

## Regla de kilometraje

Regla interpretable perteneciente a una fuente/edición y aplicable solo
a los vehículos que dicha fuente permita.

Relaciones navegables administrativas: **Fuente → Ediciones →
Importación → PDF original / resultado.**

Relación principal cliente: **Búsqueda → Vehículo → bloques EBC/Lobato →
cálculo por kilometraje.**

------------------------------------------------------------------------

# 19. Automatizaciones

1.  **Confirmación de pago → vigencia:** al confirmarse un pago válido,
    crear/extender exactamente 30 días según las reglas de acumulación.
2.  **Vencimiento → protección:** al llegar el vencimiento sin pago
    confirmado, ocultar valores/cálculos y conservar acceso gratuito.
3.  **Renovación automática:** cuando corresponda según el método/estado
    administrado con Mercado Pago, intentar la continuidad; solo una
    confirmación amplía vigencia.
4.  **Pago anticipado → desplazamiento:** si existe renovación
    automática, una ampliación manual desplaza la próxima renovación al
    nuevo vencimiento.
5.  **Publicación de edición → cambio de fuente vigente:** la nueva
    edición sustituye a la anterior solo para esa fuente.
6.  **Restauración → reactivación histórica:** la edición elegida vuelve
    a ser vigente y la actual queda conservada como no vigente.

Todas deben prevenir efectos duplicados ante notificaciones o reintentos
repetidos. La implementación queda a criterio de Cursor.

------------------------------------------------------------------------

# 20. Alcance actual V1

Incluye: - portada pública; - registro/login por WhatsApp +
contraseña; - una sesión/dispositivo activo por cliente; - búsqueda
libre, sugerencias y filtros; - consulta simultánea EBC + Lobato; -
detalle vehicular; - nivel gratuito sin valores; - producto único \$50
MXN / 30 días; - Mercado Pago con tarjeta y OXXO; - renovación
automática de tarjeta por defecto y control del cliente; - acumulación
de vigencia; - valores protegidos; - kilometraje cuando exista regla
aplicable; - importador EBC y Lobato; - revisión, advertencias
comparativas, publicación y restauración; - conservación de ediciones y
PDFs; - administración mínima de clientes; - configuración de Mercado
Pago; - PWA responsive sin offline.

------------------------------------------------------------------------

# 21. Futuro

No forma parte de V1: - verificación del WhatsApp; - OTP; - recuperación
segura de contraseña; - cambio de contraseña del cliente; - controles
avanzados de dispositivo/transferencia; - eliminación de cuenta; -
favoritos; - vehículos guardados; - historial personal de búsquedas; -
comparación/evolución histórica de valores; - herramientas adicionales
basadas en IA si aparece valor funcional demostrado.

------------------------------------------------------------------------

# 22. Fuera de alcance V1

Expresamente excluido: - búsqueda pública; - chatbot/IA; - planes
múltiples; - descuentos/cupones; - compra por catálogo; - dashboard del
cliente; - historial de pagos para cliente; - reembolsos administrados
desde Interactiva; - concesión manual de días; - bloqueo administrativo
de clientes; - CRM; - soporte/tickets/chat interno; - selector de fuente
en búsqueda; - ediciones históricas visibles para clientes; - edición
masiva manual de datos importados; - aprobación registro por registro; -
datos demo; - offline; - cambio o recuperación de contraseña de
clientes; - transferencia administrada de dispositivo; - eliminación de
cuenta.

------------------------------------------------------------------------

# 23. Dependencias y condición operativa previa

## Mercado Pago

Es dependencia indispensable para monetización y activación automática.

## Catálogos EBC y Lobato

El producto depende de PDFs reales proporcionados por el operador. El
importador debe tolerar que las ediciones cambien de estructura mediante
revisión y advertencias, sin inventar interpretaciones.

## Derechos de uso

Antes de explotación comercial en producción, el operador debe confirmar
que cuenta con los derechos/licencias necesarios para procesar y
redistribuir comercialmente la información de EBC y Lobato. El Discovery
no afirma que esos derechos existan.

## GitHub

Repositorio oficial: `https://github.com/frank-vcorp/interactiva`.

## Infraestructura

Coolify se considera infraestructura existente. Este Discovery no
prescribe una arquitectura nueva.

------------------------------------------------------------------------

# 24. Criterios de aceptación globales

La V1 se considera funcionalmente aceptable cuando:

1.  Una persona puede registrarse solo con WhatsApp y contraseña y
    entrar directamente a búsqueda.
2.  El mismo WhatsApp no puede crear cuentas duplicadas.
3.  Una segunda sesión simultánea de cliente es rechazada.
4.  Un cliente sin vigencia puede buscar y consultar características,
    pero no obtener ningún valor protegido ni cálculo.
5.  Un pago confirmado de \$50 concede exactamente 30 días.
6.  Un pago anticipado agrega 30 días sin perder vigencia existente.
7.  La renovación automática no cobra prematuramente después de una
    ampliación manual.
8.  Una referencia OXXO no pagada no concede acceso.
9.  Un fallo de Mercado Pago nunca crea vigencia ficticia.
10. Al vencer, el cliente conserva cuenta y búsqueda gratuita.
11. Buscar combina las ediciones vigentes de EBC y Lobato sin selector
    de fuente.
12. Los filtros pueden combinarse y solo ofrecen opciones compatibles.
13. El detalle identifica claramente fuente y edición de cada valor.
14. Nunca se promedian EBC y Lobato.
15. Una correspondencia incierta produce registros separados.
16. El cálculo por kilometraje solo aparece cuando existe regla
    aplicable de la fuente.
17. El valor original permanece visible junto al ajustado.
18. Una importación fallida no cambia la edición vigente.
19. El resumen de importación muestra procesados, advertencias,
    descartados y errores.
20. Cambios anormales respecto a la edición anterior se advierten antes
    de publicar.
21. Publicar EBC no altera qué edición de Lobato está vigente, y
    viceversa.
22. Una edición anterior válida puede restaurarse sin borrar la
    desplazada.
23. El PDF original y la trazabilidad de cada importación se conservan.
24. El Superusuario puede consultar clientes pero no modificar
    manualmente su vigencia.
25. Si Mercado Pago no está configurado, las acciones dependientes no
    simulan éxito.
26. La experiencia es plenamente utilizable en móvil, tablet y
    escritorio.
27. No existen datos ficticios de operación al iniciar el sistema.
28. La V1 funciona sin proveedor/modelo de IA.

------------------------------------------------------------------------

# 25. Fases de construcción y validación

Las fases siguientes son obligatoriamente las mismas del Plan de
Validación.

## Fase 1 --- Base de experiencia, acceso y navegación

Portada de Interactiva, registro/login, sesión única de cliente,
Superusuario inicial, navegación cliente/administrativa y comportamiento
responsive/PWA base.

## Fase 2 --- Catálogos, importación y trazabilidad

Importación EBC/Lobato, procesamiento funcional, resumen, advertencias,
descartes, edición vigente, historial simple, PDFs originales,
publicación y restauración.

## Fase 3 --- Búsqueda y experiencia vehicular

Búsqueda libre, sugerencias, filtros dependientes, resultados,
correspondencia conservadora EBC/Lobato y detalle completo con
procedencia.

## Fase 4 --- Valores protegidos y kilometraje

Nivel gratuito/pagado, protección de valores, conceptos económicos por
fuente y cálculos de kilometraje únicamente cuando exista regla
aplicable.

## Fase 5 --- Mercado Pago, vigencia y autoservicio

Producto \$50/30 días, tarjeta, OXXO, acumulación, renovación
automática, pagos anticipados, vencimiento, estados de integración y
cuenta/suscripción.

## Fase 6 --- Administración mínima y cierre integral

Clientes, configuración de Mercado Pago, permisos finales, estados de
error, integración completa de recorridos, responsive final y validación
de criterios globales.

------------------------------------------------------------------------

# 26. Libertad técnica de Cursor

Este documento define **qué debe hacer Interactiva**, no cómo
programarlo.

Cursor conserva libertad para decidir arquitectura, estructuras
internas, frameworks, librerías, componentes, persistencia, mecanismos
de sesión, estrategia de búsqueda, procesamiento, reintentos,
idempotencia, seguridad interna y pruebas, siempre que el comportamiento
observable cumpla este Discovery.

------------------------------------------------------------------------

## Cierre

**Nombre formal:** Interactiva\
**Repositorio:** https://github.com/frank-vcorp/interactiva\
**Discovery:** cerrado funcionalmente para V1.\
**Fuente de verdad funcional:** este documento.
