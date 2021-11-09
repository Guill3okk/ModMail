import Command from '../lib/structures/Command';

export default new Command('rename', async (caller, cmd) => {
	if (!cmd.args[0]) return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un nuevo nombre de canal.');
	cmd.channel.edit({
		name: cmd.args.join()
	})
		.then(() => caller.utils.discord.createMessage(cmd.channel.id, 'El nombre ha sido editado.'))
		.catch(() => caller.utils.discord.createMessage(cmd.channel.id, 'Ha habido un error al editar el nombre del canal.'));
},
{
	level: 'ADMIN',
	threadOnly: true,
	aliases: []
});
