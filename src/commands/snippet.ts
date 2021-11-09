import Command from '../lib/structures/Command';
import { ISnippet } from '../lib/types/Database';

export default new Command('snippet', async (caller, cmd, _log, config) => {
	if (!cmd.args[0]) return caller.utils.discord.createMessage(cmd.channel.id, 'Select `create`, `edit`, `delete` or `list`.');
	if (!cmd.args[1] && ['show', 'list'].indexOf(cmd.args[0]) < 0) return caller.utils.discord.createMessage(cmd.channel.id, 'Proporcione un nombre de fragmento.');

	const snippet = config.snippets ?
		cmd.args[1] && cmd.args[1].startsWith('anon_') ? config.snippets[cmd.args[1].slice(5)] : config.snippets[cmd.args[1]] :
		undefined;

	const list: string[] = [],
		snippets: string[][] = [],
		s = 10;
	let snippetsRAW: Record<string, ISnippet>;

	switch (cmd.args[0]) {
		// Create a snippet.
		case 'create': case 'add': case 'new':
			if (!cmd.args[2])
				return caller.utils.discord.createMessage(cmd.channel.id, 'Proporcione un texto válido.');

			// Check if the snippet exists
			if (snippet)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Ya existe un fragmento con este nombre.');

			caller.db.createSnippet(cmd.args[1].startsWith('anon_') ? cmd.args[1].slice(5) : cmd.args[1], {
				content: cmd.args.slice(2).join(' '),
				createdAt: new Date(),
				anonymous: cmd.args[1].startsWith('anon_'),
				creatorID: cmd.msg.author.id
			})
				.then(() => caller.utils.discord.createMessage(cmd.channel.id, 'Fragmento creado.'))
				.catch((error) => {
					caller.utils.discord.createMessage(cmd.channel.id, 'Ha habido un error al crear el fragmento.');
					console.error(error);
				});
			break;

		// Edit a snippet.
		case 'edit':
			if (!snippet)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No existe un fragmento con este nombre.');
			if (!cmd.args[2])
				return caller.utils.discord.createMessage(cmd.channel.id, 'Proporcione el contenido del nuevo fragmento.');

			caller.db.editSnippet(cmd.args[1], cmd.args.slice(2).join(' '));
			caller.utils.discord.createMessage(cmd.channel.id, 'El fragmento se ha actualizado.');
			break;

		// Delete a snippet.
		case 'delete': case 'remove': case 'rmv':
			if (!snippet)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No existe un fragmento con este nombre.');
			// eslint-disable-next-line no-case-declarations
			const updated = await caller.db.deleteSnippet(cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Fragmento eliminado');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo eliminar el fragmento.');
			break;

		// Show all snippets
		case 'list': case 'show':
			snippetsRAW = config.snippets;
			if (!snippetsRAW || Object.keys(snippetsRAW).length === 0)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se encontraron fragmentos.');

			for (const name of Object.keys(snippetsRAW))
				list.push(`${name} | ${snippetsRAW[name].content.length > 50 ? snippetsRAW[name].content.substr(0, 50) + '...' : snippetsRAW[name].content}`);

			while (list.length > 0)
				snippets.push(list.splice(0, s));
			// Send the list
			for (const s of snippets)
				caller.utils.discord.createMessage(cmd.channel.id, `\`\`\`\nNAME | CONTENT\n-----------\n${s.join('\n')}\`\`\``);
			break;
		default:
			caller.utils.discord.createMessage(cmd.channel.id, 'Select `create`, `edit`, `delete` or `list`.');
			break;
	}
},
{
	level: 'ADMIN',
	aliases: ['qr', 'quickreply']
});
