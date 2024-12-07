$(function() {
    // Ensure Leaflet JS is loaded by checking if 'L' is defined
    if (typeof L === 'undefined') {
        console.error("Leaflet library is not loaded. Please ensure you have included the Leaflet.js script in your HTML.");
        return;
    }

    var mouseIsDown = false;
    var isPaintingMode = false; // Track whether we are in painting mode
    var map = L.map('mapid', {
        zoomControl: true,
        dragging: true // Enable dragging initially
    }).setView([51.505, -0.09], 13);

    // Load and display OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Get reference to canvas overlay
    var canvas = document.getElementById('map-overlay');
    var ctx = canvas.getContext('2d');

    // Set a higher z-index to ensure the canvas is on top of the map
    canvas.style.zIndex = '1000';
    canvas.style.pointerEvents = 'auto'; // Allow canvas to receive mouse events

    // Set up canvas dimensions to match the map container
    function resizeCanvas() {
        canvas.width = map.getSize().x;
        canvas.height = map.getSize().y;
        repositionCanvas();
        console.log("Canvas resized: width = " + canvas.width + ", height = " + canvas.height);
    }

    function repositionCanvas() {
        var topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);
        console.log("Canvas repositioned to: top = " + topLeft.y + ", left = " + topLeft.x);
    }

    // Initialize canvas dimensions and reposition it correctly
    resizeCanvas();
    map.on('resize', resizeCanvas);
    map.on('move', repositionCanvas);
    map.on('zoom', repositionCanvas);

    var session = {
        'points': [],
        'state': true,
        'item': 0
    };

    // Attach mouse events directly to the canvas for drawing
    $(canvas).on('mousedown', function(e) {
        if (isPaintingMode) {
            mouseIsDown = true;
            console.log("Mouse down: painting started.");
        }
    });

    $(canvas).on('mousemove', function(e) {
        if (!mouseIsDown || !isPaintingMode) return;

        // Get the mouse position relative to the canvas
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        console.log("Mouse move: x = " + x + ", y = " + y);

        // Draw directly on the canvas at the calculated position
        ctx.fillStyle = ctx.fillStyle; // Ensure fillStyle is set from the selected color
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fill();

        // Convert canvas coordinates to map coordinates and store in session
        var latlng = map.containerPointToLatLng([x, y]);
        session.points.push({ 'color': ctx.fillStyle, 'latlng': latlng });
        console.log("Point drawn at latlng: " + latlng.lat + ", " + latlng.lng);
    });

    $(canvas).on('mouseup', function(e) {
        if (isPaintingMode) {
            mouseIsDown = false;
            console.log("Mouse up: painting ended.");
        }
    });

    $('.color-picker div').bind('click', function() {
        if ($(this).hasClass('active')) {
            // If the color is already active, disable painting mode and enable dragging
            $(this).removeClass('active');
            isPaintingMode = false;
            map.dragging.enable();
            console.log("Painting mode disabled, dragging enabled.");
        } else {
            // If the color is not active, enable painting mode
            ctx.fillStyle = $(this).data('color');
            $('.color-picker div').removeClass('active');
            $(this).addClass('active');
            isPaintingMode = true;
            map.dragging.disable(); // Disable map dragging to allow painting
            console.log("Painting mode enabled with color: " + ctx.fillStyle);
        }
    });

    // Handle the escape key to exit painting mode
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && isPaintingMode) {
            $('.color-picker div').removeClass('active');
            isPaintingMode = false;
            map.dragging.enable();
            console.log("Escape key pressed: Painting mode disabled, dragging enabled.");
        }
    });

    // Add a button to switch back to dragging mode explicitly
    $('#exitPaintingModeButton').on('click', function() {
        $('.color-picker div').removeClass('active');
        isPaintingMode = false;
        map.dragging.enable();
        console.log("Exit Painting Mode button clicked: Painting mode disabled, dragging enabled.");
    });

    function redrawCanvas() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redraw all points from the session
        session.points.forEach(function(a) {
            var point = map.latLngToContainerPoint(a.latlng);
            var x = point.x;
            var y = point.y;

            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
            console.log("Redrawing point at: x = " + x + ", y = " + y + ", color = " + a.color);
        });
    }

    // Redraw the canvas whenever the map moves or zooms
    map.on('move', redrawCanvas);
    map.on('zoom', redrawCanvas);
});
