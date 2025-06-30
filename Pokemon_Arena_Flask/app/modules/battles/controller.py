from app.modules.battles.sockets import active_players, Player

class BattlesController:
    def index(self):
        return {'message':'Hello, World!'}

    def get_pokemon(self, request, current_user):
        print(request.args)
        if not request or not current_user:
            return {'error': 'Invalid request or user not authenticated'}, 400
        
        pokemon_id = request.args.get('pokemon_id')
        if not pokemon_id:
            return {'error': 'Pokemon ID is required'}, 400
        
        player = list(filter(lambda p: p.username == current_user.username, active_players.values()))[0]
        
        response = list(filter(lambda p: int(p.get('id')) == int(pokemon_id), player.pokemon))
        if not len(response) == 1:
            return {'error': 'Pokemon not found'}, 404
        
        # print(f"{response[0]} found pokemon")  # Debug line
        return response[0], 200