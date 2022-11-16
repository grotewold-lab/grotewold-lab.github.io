// this is the source code for a flexible, general visualzation tool

function add_mouse_listener_to_canvas(canvas,ctx){

    ctx.canvasWidth = canvas.width;
    ctx.canvasHeight = canvas.height;

    $(".hovermenu").detach().appendTo(document.documentElement);

    is_mouse_down = false
    is_mouse_dragging = false  
    held_node = null
    held_pos = null

    canvas.onmousemove = function(e) {
        ctx.show_legend = false

        
        // get mouse position in terms of coordinates
        // that were used for drawing on the canvas
        var rect = this.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;

        // handle click-and-drag
        if( is_mouse_down ){
            is_mouse_dragging = true
            if( held_node != null ){
                held_node.x = x/ctx.view_scale - ctx.view_offset[0]
                held_node.y = y/ctx.view_scale - ctx.view_offset[1]
                ctx.node_coords[held_node.data.gene_id] = [held_node.x,held_node.y]
                update_edges(ctx)
            }
            if( held_pos != null ){
                ctx.view_offset[0] = (x-held_pos[0])/ctx.view_scale;
                ctx.view_offset[1] = (y-held_pos[1])/ctx.view_scale;
            }
        } else {
            // check if hovering over help icon
            if( (x<20) && (y<20) ){
                ctx.show_legend = true
            }
        }
        

        // make hover caption invisible by default
        var hovermenu = $('.hovermenu');
        hovermenu.removeClass('visible');
        canvas.style.cursor = 'default'
        ctx.click_url = null;
        
        // check for buttons at mouse position
        if( is_mouse_on_button(x,y,ctx.load_more_button) ){
            ctx.load_more_button.hl = true
            canvas.style.cursor = 'pointer'
            update_display( ctx )
            return
        } else {
            if( ctx.load_more_button ) ctx.load_more_button.hl = false
        }
        
        // check for nodes at mouse position
        // starting with the "top" (most visible) nodes
        var hover_node = get_node_at_mouse_pos( ctx, x, y )
                
        if( hover_node != null ){
            // got a hit, show caption  and stop checking
            hovermenu.addClass('visible');
            hovermenu.css({top: e.pageY+10, left: e.pageX+10});
            hovermenu.html( get_details_for_node(node.data) )
            
            var url = get_url_for_node( hover_node.data )
            if( url != null ){
                canvas.style.cursor = 'pointer'
                ctx.click_url = url;
            }

            update_display( ctx )
            return
        }
        
        // check for edges near mouse position
        x = x/ctx.view_scale - ctx.view_offset[0]
        y = y/ctx.view_scale - ctx.view_offset[1]
        i = ctx.edges.length-1;
        while(edge = ctx.edges[i--]) {
            
            // find distance^2 from mouse to edge
            dp = [x-edge.a[0], y-edge.a[1]]
            a = (dp[0]*edge.d[0] + dp[1]*edge.d[1])/edge.det
            if( (a<0) || (a>1) ){
                continue   
            }
            np = [edge.a[0] + a*edge.d[0], edge.a[1] + a*edge.d[1]]
            d2 = Math.pow(np[0]-x,2) + Math.pow(np[1]-y,2)
            
            if( d2 < 100 ){
                
                // got a hit, show caption  and stop checking
                hovermenu.addClass('visible');
                hovermenu.css({top: e.pageY+10, left: e.pageX+10});
                hovermenu.html( get_details_for_edge(edge.data) )

                update_display( ctx )
                return
            }
        }

        update_display( ctx )
    };

    canvas.onmouseout = function(e){
        $('.hovermenu').removeClass('visible')
        if( ctx.load_more_button ) ctx.load_more_button.hl = false
        update_display( ctx )
    }
    
    canvas.addEventListener('mousedown', function(e) {
        is_mouse_down = true

        var rect = this.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;
        
        held_node = get_node_at_mouse_pos( ctx, x, y )
        if(held_node != null ){
            held_node.held = true
            held_pos = null
        } else {
            held_pos = [
                x-(ctx.view_offset[0]*ctx.view_scale),
                y-(ctx.view_offset[1]*ctx.view_scale)
            ]
        }

        update_display( ctx )

    })
    
    canvas.addEventListener('mouseup', function(e) {

        i = ctx.nodes.length-1;
        while(node = ctx.nodes[i--]) {
            node.held = false
        }

        //click on node
        if( (!is_mouse_dragging) && ctx.click_url != null ){
            var win = window.open(ctx.click_url, '_blank');
            if (win) {
                win.focus();
            }
        }
        
        //click on button
        if( (!is_mouse_dragging) && ctx.load_more_button && ctx.load_more_button.hl ){
            load_more_data_from_api(ctx)  
        }

        is_mouse_down = false
        is_mouse_dragging = false
        held_pos = null
        held_node = null
    })
    
    canvas.onwheel = function(event){
        // adjust scale, then adjust offset to maintain center
        var old_scale = ctx.view_scale
        ctx.view_scale -= event.deltaY/1000
        var m = ctx.view_scale / old_scale
        var vw = ctx.canvasWidth / m
        var vh = ctx.canvasHeight / m 
        ctx.view_offset[0] += (vw-ctx.canvasWidth)/2
        ctx.view_offset[1] += (vh-ctx.canvasHeight)/2
        update_display( ctx )
        event.preventDefault();
    };
}

// button is a rectnagle with properties x,y,w,h
function is_mouse_on_button( x, y, button ){
    return button && (x>button.x) && (x<(button.x+button.w)) && (y>button.y) && (y<(button.y+button.h))
}
    
function get_node_at_mouse_pos( ctx, x, y ){

        
    // check for nodes at mouse position
    // starting with the "top" (most visible) nodes
    i = ctx.nodes.length-1;
    while(node = ctx.nodes[i--]) {
        build_path_for_node_on_canvas( ctx, node.x, node.y, node.data, ctx.view_scale, ctx.view_offset )
        if( ctx.isPointInPath(x, y) ){
            return node
        }
    }

    return null
}

function get_details_for_edge( edge_data ){

    if( edge_data.support == 1 ) {
        var support_message = '<font color="#FAA">WARNING this interaction is only supported by one source of data</font>'
    } else {
        var support_message = 'supported by ' + edge_data.support + ' independent sources'
    }

   return [
       '<b>Interaction</b>',
       '',
       support_message,
       '',
       'Distance to annotated<br>peak in TSS: ' + edge_data.distance + ' kb',
       '',
       'Experiment: '  + edge_data.experiment,
       'Regulator: ' + edge_data.gene_id,
       'Target: ' + edge_data.target_id,
   ].join('<br>')
}

function get_details_for_node( node_data ){
    if( isTF(node_data) ){
       return [
           '<b>Transription Factor</b>',
           '',
           'TF Name: ' + node_data.protein_name,
           'Gene ID: ' + node_data.gene_id,
           '',
           'click to view on GRASSIUS'
       ].join('<br>')
    }
   return [
       '<b>Gene</b>',
       '',
       'Gene ID:' + node_data.gene_id,
       '',
       'click to view on MaizeGDB'
   ].join('<br>')
}

function get_url_for_node( node_data ){
    if( isTF(node_data) ){
        return 'https://eglab-dev.com/proteininfor/Maize/' + node_data.protein_name
    } else {
        return 'http://maizegdb.org/gene_center/gene/' + node_data.gene_id;   
    }
}


function update_display( ctx ){

    // clear display
    ctx.clearRect(0, 0, ctx.canvasWidth, ctx.canvasHeight);  
    
    // draw edges
    n_edges = ctx.edges.length
    for( var i = 0 ; i < n_edges ; i++ ){
        drawEdge(ctx, ctx.edges[i], ctx.view_scale, ctx.view_offset)
    }

    // draw nodes
    ctx.font = '12px monospaced';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    n_nodes = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        drawNode(ctx, node, ctx.view_scale, ctx.view_offset )
    }

    if( ctx.show_legend ){
        drawLegend( ctx )
    } else {
        drawHelpIcon( ctx ) 
    }
    
    if( ctx.load_more_button ){
        drawLoadMoreButton(ctx)
    }
    
}

function load_more_data_from_api(ctx){
    
    ctx.draw_num += 1;
    
    // request json data from api
    $.ajax({
        
        url: ctx.api_url + "/" + ctx.draw_num, 
        
        // update network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            update_network_with_json(ctx,json_data)
        }
        
    })
}

function update_network_with_json( ctx, json_data ){
    var new_nodes = json_data['nodes']
    var new_edges = json_data['edges']
    
    
    // identify which nodes are actually new
    var actually_new_nodes = []
    var n = new_nodes.length
    for( var i = 0 ; i < n ; i++ ){
        var existing_node = get_node( ctx, new_nodes[i].gene_id )
        if( existing_node == null ) {
            actually_new_nodes.push(new_nodes[i])
        }
    }    
    
    // insert new nodes into visualization
    var n = actually_new_nodes.length
    for( var i = 0 ; i < n ; i++ ){
        var node_data = actually_new_nodes[i]
        var p = pick_new_node_location( ctx, node_data, new_edges)
        ctx.nodes.push({
            x: p[0],
            y: p[1],
            data: node_data
        })
        ctx.node_coords[node_data.gene_id] = p
    }
    
    // insert new edges into visualization
    var n = new_edges.length
    for( var i = 0 ; i < n ; i++ ){
        var a = ctx.node_coords[new_edges[i].gene_id]
        var b = ctx.node_coords[new_edges[i].target_id]
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges.push({
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: new_edges[i]
        })
    }
    
    update_display(ctx)
}

// pick a good location for a new node
// used in update_network_with_json
function pick_new_node_location( ctx, new_node_data, new_edges ){
    if( ctx.nodes.length == 0 ){
        return [0,0]   
    }
    
    var gid = new_node_data.gene_id
    
    // check for existing neighbor
    var n = new_edges.length
    for( var i = 0; i < n ; i++ ) {
        var ne = new_edges[i]
        var neighbor = null
        if( ne.gene_id == gid ){
            neighbor = get_node( ctx, ne.target_id )
        } else if( ne.target_id == gid ) {
            neighbor = get_node( ctx, ne.gene_id )
        }
        if(neighbor){
            return pick_neighbor_location( ctx, neighbor )
        }
    }
    
    // no existing neighbors, so pick an arbitrary open spot
    return pick_neighbor_location( ctx, ctx.nodes[0] )
}

// pick an open location nearby an existing node
// used in pick_new_node_location()
function pick_neighbor_location( ctx, existing_node ){
    
    // spiral outward until an open location is found
    var a = 0
    var r = 100
    var maxr = 100000
    var dr = 50
    while( r < maxr ) {
        var tx = existing_node.x + r*Math.cos(a)
        var ty = existing_node.y + r*Math.sin(a)
        if( is_location_open(ctx,tx,ty) ){
            return [tx,ty] // found a good spot
        }
        if( a > Math.PI*2 ){
            a = 0
            r += dr
        } else {
            a += dr/r
        }
    }
    
    // give up and return some location
    return [200,200]
}

// return true if there is space for a new node centered at the given location
// used in pick_neighbor_location
function is_location_open( ctx, x, y ){
    var maxr2 = 100*100
    var n = ctx.nodes.length
    for( var i = 0; i < n ; i++ ) {
        var node = ctx.nodes[i]
        var r2 = Math.pow(x-node.x,2) + Math.pow(y-node.y,2)
        if( r2 < maxr2 ){
            return false;   
        }
    }
    return true
}

// get an existing node by identifier
function get_node( ctx, gene_id ){
    var n = ctx.nodes.length
    for( var i = 0 ; i < n_nodes ; i++ ){
        var node = ctx.nodes[i]
        if( node.data.gene_id == gene_id ) {
            return node   
        }
    }    
    return null
}


function show_network_with_static_json( ctx, w, h, json_data ){

    ctx.view_offset = [0,0]
    ctx.view_scale = 1
    
    var nodes = json_data['nodes']
    var edges = json_data['edges']
    
    var n_nodes = nodes.length
    var da = Math.PI*2 / n_nodes
    var dist = 200
    
    var node_coords = {}
    var node_data_by_gid = {}
    for( var i = 0 ; i < n_nodes ; i++ ){        
        var x = w/2 + dist*Math.cos(i*da);
        var y = h/2 + dist*Math.sin(i*da);
        var gid = nodes[i].gene_id
        node_coords[gid] = [x,y]
        node_data_by_gid[gid] = nodes[i]
    }
    
    
    // build edges
    ctx.strokeStyle = 'black'
    ctx.edges = []
    for( var i = 0 ; i < edges.length ; i++ ){
        var a = node_coords[edges[i].gene_id]
        var b = node_coords[edges[i].target_id]
        
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges[i] = {
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: edges[i]
        }
    }
    
    // build nodes
    ctx.node_coords = node_coords
    ctx.nodes = []
    for( var i = 0 ; i < n_nodes ; i++ ){
        var label = nodes[i].gene_id;
        var xy = node_coords[label]
    
        ctx.nodes[i] = {
            x: xy[0],
            y: xy[1],
            data: nodes[i]
        }
    }    

    update_display( ctx )
}

function update_edges(ctx){
    
    for( var i = 0 ; i < ctx.edges.length ; i++ ){
        var edge = ctx.edges[i]
        var a = ctx.node_coords[edge.data.gene_id]
        var b = ctx.node_coords[edge.data.target_id]
        
        var d = [b[0]-a[0],b[1]-a[1]]
        ctx.edges[i] = {
            a: a,
            b: b,
            d: d,
            det: d[0]*d[0] + d[1]*d[1],
            data: edge.data
        }
    }
    
}


function show_network_with_api( ctx, w, h, api_url, success_func=null ){
    
    ctx.api_url = api_url
    ctx.draw_num = 0
    
    // request json data from api
    $.ajax({
        
        url: api_url + "/0", 
        
        // show network when data is received
        success: function(response_data){
            json_data = JSON.parse(response_data)
            ctx.load_more_button = {x:700,y:0,w:100,h:20}
            show_network_with_static_json( ctx, w, h, json_data )
            if( success_func != null ){
                success_func(response_data);   
            }
        }
        
    })
}


function show_network_with_callback( ctx, w, h, callback_function ) {
       
    // get json data from the callback function
    json_data = callback_function()
    show_network_with_static_json( ctx, w, h, json_data )
}


function drawEdge( ctx, edge, scale=1, offset=[0,0] ){
    var a = edge.a
    var b = edge.b
    var support = edge.data.support
    
    ctx.lineWidth = support;
    if( support == 1 ){        
        ctx.setLineDash([5, 3]);
    }
    drawArrow(ctx, a[0],a[1],b[0],b[1], scale, offset)
}


function drawArrow(context, fromx, fromy, tox, toy, scale=1, offset=[0,0]) {
    
    fromx = (fromx+offset[0])*scale
    fromy = (fromy+offset[1])*scale
    tox = (tox+offset[0])*scale
    toy = (toy+offset[1])*scale
    
    context.lineCap = "round";
    var shrink = 50 * scale; // length reduction in pixels
    var rawd = Math.sqrt( Math.pow(tox-fromx,2) + Math.pow(toy-fromy,2) )
    var ratio = (rawd-shrink)/rawd
    tox = fromx + (tox-fromx)*ratio
    toy = fromy + (toy-fromy)*ratio
   
    
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);

    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();

    context.beginPath();
    context.setLineDash([]);
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
}


function build_path_for_node_on_canvas( ctx, x, y, node_data, scale=1, offset=[0,0] ){
    
    x = (x+offset[0]) * scale
    y = (y+offset[1]) * scale
    
    ctx.beginPath()
    
    // draw square if node represents a TF
    if( isTF(node_data) ){
          var rad = 40*scale
          ctx.moveTo(x-rad, y-rad)
          ctx.lineTo(x-rad, y+rad)
          ctx.lineTo(x+rad, y+rad)
          ctx.lineTo(x+rad, y-rad)
          ctx.lineTo(x-rad, y-rad)
    }
    
    // otherwise draw a circle
    else {
        var radius = 45*scale
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    }
}

function isTF( node_data ){
    try{
        return Object.hasOwn(node_data, 'protein_name')
    }catch(error){
        return node_data.hasOwnProperty('protein_name')
    }
}

function drawLoadMoreButton(ctx){
    
    x = ctx.load_more_button.x
    y = ctx.load_more_button.y
    w = ctx.load_more_button.w
    h = ctx.load_more_button.h
    hl = ctx.load_more_button.hl
    
    if( hl ){
        ctx.fillStyle = 'black'
    } else {
        ctx.fillStyle = '#CCC'
    }
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()
    
    if( hl ){
        ctx.fillStyle = 'white'
    } else {
        ctx.fillStyle = 'black'
    }
    ctx.fillText('load more data', x+w/2, y+h/2+3);
}

function drawHelpIcon(ctx){
    var x = 0
    var y = 0
    var w = 20
    var h = 20
    ctx.fillStyle = '#CCC'
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()
    
    ctx.fillStyle = 'black'
    ctx.fillText('?', x+w/2, y+h/2+3);
}

function drawLegend(ctx){

    var x = 0
    var y = 0
    var w = 200
    var h = 280
    ctx.fillStyle = '#CCC'
    ctx.beginPath()
    ctx.moveTo(x,y)
    ctx.lineTo(x+w,y)
    ctx.lineTo(x+w,y+h)
    ctx.lineTo(x,y+h)
    ctx.lineTo(x,y)
    ctx.fill()

    ctx.fillStyle = 'black'
    ctx.fillText('Legend:', x+35, y+40);
    drawNode(ctx, {
        x: x+200,
        y: y+90,
        data: {
            protein_name: 'TF'
        }
    }, .5)

    drawNode( ctx, {
        x: x+300,
        y: y+90,
        data: {
            gene_id: 'Gene'
        }
    }, .5)

    var yo1 = 110
    var yo2 = 150

    drawEdge( ctx, {
        a: [x+30,y+yo1],
        b: [x+130,y+yo1],
        data:{support:1}
    });

    var xo = 140
    ctx.fillStyle = 'black'
    ctx.fillText('Interaction', x+xo, y+yo1);
    ctx.fillText('(weak evidence)', x+xo, y+yo1+15);

    drawEdge( ctx, {
        a: [x+30,y+yo2],
        b: [x+130,y+yo2],
        data:{support:5}
    });

    ctx.fillStyle = 'black'
    ctx.fillText('Interaction', x+xo, y+yo2);
    ctx.fillText('(strong evidence)', x+xo, y+yo2+15);
    
    xo = 10
    var yo = 200
    var dy = 15
    ctx.textAlign = "left";
    ctx.fillText('Hover over nodes or edges for info', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click nodes to open a new tab', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click and drag nodes to move them', x+xo, y+yo);
    yo += dy
    ctx.fillText('Click and drag background to pan', x+xo, y+yo);
    yo += dy
    ctx.fillText('Zoom with the mousewheel', x+xo, y+yo);
    ctx.textAlign = "center";
    
    
}

function drawNode(ctx, node, scale=1, offset=[0,0] ) {
    
    var x = node.x
    var y = node.y
    var node_data = node.data

    var stroke = 'black'
    var strokeWidth = 1

    
    if( isTF(node_data) ){
        var fill = '#FAA'
    } else {
        var fill = '#AFA'
    }
    
    // draw shape
    ctx.fillStyle = fill
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = stroke
    build_path_for_node_on_canvas( ctx, x, y, node_data, scale, offset )
    if (fill) {
        ctx.fill()
    }
    if (stroke) {
        ctx.stroke()
    }
    
    // draw label
    if( scale > .5 ) {
        x = (x+offset[0]) * scale
        y = (y+offset[1]) * scale
        ctx.fillStyle = 'black';
        ctx.textAlign = "center";
        if( isTF(node_data) ){
            var label = node_data.protein_name
            var co = 20
        } else {
            var label = node_data.gene_id
            var co = 8
        }
        if( label.length > co ){
            ctx.fillText(label.substring(0,co), x, y-7);
            ctx.fillText(label.substring(co), x, y+13);
        } else {
            ctx.fillText(label, x, y);
        }
    }
}
