import Command from '../lib/structures/Command';

export default new Command('subscribe', async (caller, cmd, log) => {
	if (log!.subscriptions.includes(cmd.msg.author.id))
		return caller.utils.discord.createMessage(cmd.channel.id, 'Ya estás suscrito a este hilo.');
	const updated = await caller.db.updateLog(log!._id, 'subscriptions', cmd.msg.author.id, 'PUSH');
	if (updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'Ahora recibirá notificaciones sobre nuevas respuestas.');
	if (!updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'Hubo un error al suscribirte a este hilo.');
},
{
	level: 'SUPPORT',
	threadOnly: true,
	aliases: []
});
