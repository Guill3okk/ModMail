import Command from '../lib/structures/Command';

export default new Command('edit', async (caller, cmd, log) => {
	if (!cmd.args[0])
		return caller.utils.discord.createMessage(cmd.channel.id, 'Por favor, proporcione un ID de mensaje.');
	if (!cmd.args[1])
		return caller.utils.discord.createMessage(cmd.channel.id, 'Por favor, proporcione el nuevo contenido.');

	const guildMsg = await caller.utils.discord.fetchMessage(cmd.channel.id, cmd.args[0]);
	if (!guildMsg || !guildMsg.embeds[0])
		return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo encontrar el mensaje.');

	const message = log!.messages.find((m) => m.id === guildMsg.id);
	if (!message || message.type !== 'STAFF_REPLY')
		return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo encontrar el mensaje.');

	const userMsg = await caller.utils.discord.fetchMessage(log!.recipient.id, message.complementaryID!, true);
	if (!userMsg || !userMsg.embeds[0])
		return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo encontrar el mensaje.');

	// Edit the user message.
	userMsg.embeds[0].description = cmd.args.slice(1).join(' ');
	userMsg.edit({ embed: userMsg.embeds[0] })
		.catch(() => {
			return caller.utils.discord.createMessage(cmd.channel.id, 'El mensaje no se pudo editar para el usuario.');
		});

	caller.db.editMessage(log!, message.id, cmd.args.slice(1).join(' '));

	guildMsg.embeds[0].description = cmd.args.slice(1).join(' ');
	guildMsg.embeds[0].footer ? guildMsg.embeds[0].footer.text = 'Edited' : guildMsg.embeds[0].footer = { text: 'Edited' };
	guildMsg.edit({ embed: guildMsg.embeds[0] })
		.catch(() => {
			return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo editar el mensaje en este canal.');
		});
	caller.utils.discord.createMessage(cmd.channel.id, 'El mensaje ha sido editado.');
},
{
	level: 'SUPPORT',
	threadOnly: true,
	aliases: []
});
