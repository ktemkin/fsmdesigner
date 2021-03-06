###
  
 [Hey, this is CoffeeScript! If you're looking for the original source,
  look in "fsm.coffee", not "fsm.js".]

 Finite State Machine Designer
 portions Copyright (c) Binghamton University,
 author: Kyle J. Temkin <ktemkin@binghamton.edu>

 Based on:
 Finite State Machine Designer (http://madebyevan.com/fsm/)
 portions Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

###

class exports.VHDLExporter

  #
  # Initialies a new VHDL exporter.
  # 
  constructor: (@designer, @name) ->
    @inputs = @designer.inputs()
    @outputs = @designer.outputs()

  #
  # Renders a simple header.
  #
  #
  _render_header: ->
    header  = "---\n"
    header += "--- Finite State Machine: #{name}\n"
    header += "--- Automatically Generated by FSMDesigner\n"
    header += "---\n\n"
    header


  #
  # Render the standard VHDL "includes".
  #
  _render_includes: ->
    includes  = "library IEEE;\n"
    includes  += "use IEEE.std_logic_1164.all;\n\n"
    includes


  #
  # Generates an entity for the given VHDL module.
  #
  _render_entity: ->
    entity  = "entity #{@name} is port(\n"
    
    entity += "  --Global signals.\n"
    entity += "  clk : in std_ulogic;\n"
    entity += "  reset : in std_ulogic;\n" if @designer.has_reset_transition()
    entity += "\n"

    #Insert inputs, if applicable.
    if @designer.inputs()
      entity += "  --FSM inputs:\n  "
      entity += @_io_list(@inputs, 'in') + ";\n\n"


    entity += "  --FSM outputs:\n  "
    entity += @_io_list(@outputs, 'out') + "\n"
    entity += ");\n"
    entity += "end entity;"
    entity



  #
  # Returns a VHDL-format list of inputs or outputs.
  #
  _io_list: (names, direction, type='std_ulogic') ->

    #Get a list of all VHDL port declarations.
    io = ("#{name} : #{direction} #{type}" for name in names)

    #And join them with a semicolon.
    io.join(";\n  ")


  #
  # Generates an architecture for the given VHDL module.
  #
  _render_architecture: ->
    
    #Define the main types for the FSM.
    architecture  = "architecture finite_state_machine of #{@name} is\n\n"
    architecture += "  --Define a custom type to store the current state.\n"
    architecture += "  type machine_state is (#{@_state_names().join(', ')});\n\n"
    architecture += "  --And create a register for the current state.\n"
    architecture += "  signal state : machine_state;\n\n"
    architecture += "begin\n\n"

    #Implement the main controller.
    architecture += @_controller_process()

    #And close all of the functional elements.
    architecture += "end architecture;\n"


  #
  # Returns a list of VHDL state names, which are used to internally represent the given state.
  #
  _state_names: ->
    #TODO: Deoub
    @_state_name(state) for state in @designer.get_states()

  #
  # Creates a VHDL-friendly state name.
  #
  _state_name: (state) ->
    "STATE_#{state.id}"

  #
  # Returns the state name for the reset transition.
  #
  _get_reset_state_name: ->
    @_state_name(@designer.get_reset_transition().destination)

  #
  # Generates the main process for a FSM controller.
  #
  _controller_process: ->

    #Open the process
    process  = "  --Main controller for the given FSM.\n"
    process += "  process(clk)\n"
    process += "  begin\n\n"
    process += "    --Ensure that the whole process is synchronous.\n"
    process += "    if rising_edge(clk) then\n\n"

    #Ensure that outputs are low unless explicitly asserted.
    process += "      --Ensure that all outputs are low unless explicitly asserted.\n"
    process += "      #{output} <= '0';\n" for output in @outputs
    process += "      \n"

    #Add in the logic for each of the FSM states.
    process += "      case state is\n\n"
    process += ("#{@_logic_for_state(state)}\n" for state in @designer.get_states()).join("\n")
    process += "      end case;\n\n"

    #Handle the reset transition
    if @designer.has_reset_transition()
      process += "      --Handle the reset arc.\n"
      process += "      if reset = '1' then\n"
      process += "        state <= #{@_get_reset_state_name()};"
      process += " --#{@designer.get_reset_transition().destination.name}\n"
      process += "      end if;\n\n"


    #Close the process.
    process += "    end if;\n"
    process += "  end process;\n\n"

    process


  #
  # Creates the next-state and output logic for a given state.
  # 
  _logic_for_state: (state) ->
    
    #Add the case condition for the current state.
    logic  = "        --\n"
    logic += "        -- Original name: #{state.name}\n"
    logic += "        --\n"
    logic += "        when #{@_state_name(state)} =>\n\n"

    #Add each of the Moore outputs.
    if state.outputs.trim() isnt ''
      logic += "          --State outputs:\n"
      logic += "          #{output.to_VHDL()}\n" for output in state.output_equations()
      logic += "          \n"

    #Add each of the next-state conditions.
    for transition in @designer.transitions_leaving_state(state)
      logic += "          if #{@_transition_predicate(transition)} then\n"
      logic += "            state <= #{@_state_name(transition.destination)}; -- #{transition.destination.name}\n"
      logic += "          end if;\n"
 

    logic


  #
  # Returns a VHDL predicate which is true iff the given condition should be taken.
  #
  _transition_predicate: (transition) ->
    return "true" if transition.is_unconditional_transition()
    "#{transition.expression().to_VHDL_expression()} = '1'"


  #
  # Creates a new VHDL hardware description of the given FSM.
  #
  render: ->
    vhdl  = "#{@_render_header()}\n\n"
    vhdl += "#{@_render_includes()}\n\n"
    vhdl += "#{@_render_entity()}\n\n"
    vhdl += "#{@_render_architecture()}\n"



